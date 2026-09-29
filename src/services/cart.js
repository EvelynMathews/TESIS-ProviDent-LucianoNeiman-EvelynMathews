/**
 * Servicio de gestión del carrito de compras integrado con Supabase.
 * Propósito: Almacenar de forma reactiva los ítems que el usuario agrega
 * a su carrito antes de finalizar la compra.
 * Funcionamiento: Mantiene un array `cartItems` reactivo (Vue ref) que se
 * sincroniza con Supabase. Si el usuario no inició sesión, el carrito se guarda
 * en localStorage y al iniciar sesión se pasa a Supabase (`mergeGuestCart`).
 * Proporciona funciones CRUD para que los componentes accedan y modifiquen el carrito.
 */

import { ref } from 'vue'
import { supabase } from './supabase'

const cartItems = ref([])
let currentUserId = null
let syncing = null

const GUEST_CART_KEY = 'provident-guest-cart'

const PRODUCT_FIELDS = `
  id,
  name,
  description,
  product_type,
  owner_user_id,
  supply_products (unit_label),
  product_images (path, is_primary, position)
`

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || []
  } catch {
    return []
  }
}

function writeGuestCart(items) {
  if (items.length === 0) localStorage.removeItem(GUEST_CART_KEY)
  else localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

/**
 * Inicializa el carrito para un usuario específico
 * Crea un carrito si no existe, o retorna el existente
 */
async function initializeCart(userId) {
  if (!userId) return null

  currentUserId = userId

  // usar maybeSingle() en lugar de single() para evitar errores 406
  const { data: existingCart, error: fetchError } = await supabase
    .from('carts')
    .select('id')
    .eq('buyer_user_id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching cart:', fetchError)
    return null
  }

  if (existingCart) {
    return existingCart.id
  }

  // no existe carrito, crear uno nuevo
  const { data: newCart, error: createError } = await supabase
    .from('carts')
    .insert({ buyer_user_id: userId })
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating cart:', createError)
    return null
  }

  return newCart.id
}

/**
 * Carga todos los items del carrito desde Supabase
 * Incluye joins con rental_cart_items y plaster_service_cart_items
 */
export async function fetchCartItems(userId) {
  if (!userId) {
    cartItems.value = []
    return
  }

  try {
    const cartId = await initializeCart(userId)
    if (!cartId) return

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        unit_price_snapshot,
        options_json,
        products (${PRODUCT_FIELDS}),
        rental_cart_items (
          start_date,
          end_date,
          start_time,
          end_time,
          total_days,
          calculated_price
        ),
        plaster_service_cart_items (
          custom_description
        )
      `)
      .eq('cart_id', cartId)

    if (error) {
      console.error('Error fetching cart items:', error)
      return
    }

    cartItems.value = await toCartItems(data)
  } catch (error) {
    console.error('Error in fetchCartItems:', error)
  }
}

async function toCartItems(rows) {
  const ownerIds = rows.map(item => item.products.owner_user_id).filter(Boolean)
  const owners = await fetchOwnerNames(ownerIds)

  return Promise.all(rows.map(async (item) => {
    const product = item.products
    const owner = owners[product.owner_user_id] || { name: 'Vendedor', avatar_url: null }

    let imgPath = pickPrimaryImage(product.product_images || [])
    const image = await signedImageUrl(imgPath)

    const baseItem = {
      id: item.id,
      product_id: item.product_id,
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      image,
      price: item.unit_price_snapshot,
      quantity: item.quantity,
      seller: {
        id: product.owner_user_id,
        username: owner.name,
        avatar_url: owner.avatar_url
      }
    }

    if (product.product_type === 'SUPPLY' && product.supply_products) {
      baseItem.unit = product.supply_products.unit_label
    }

    if (product.product_type === 'RENTAL' && item.rental_cart_items) {
      baseItem.rental_details = item.rental_cart_items
    }

    if (product.product_type === 'PLASTER_SERVICE' && item.plaster_service_cart_items) {
      baseItem.custom_description = item.plaster_service_cart_items.custom_description
    }

    if (product.product_type === 'PROSTHESIS' && item.options_json) {
      baseItem.config = item.options_json
    }

    return baseItem
  }))
}

async function loadGuestItems() {
  const guest = readGuestCart()
  if (guest.length === 0) {
    cartItems.value = []
    return
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .in('id', [...new Set(guest.map(g => g.product_id))])
  if (error) {
    console.error('Error loading guest cart:', error)
    return
  }

  const productsById = Object.fromEntries(data.map(p => [p.id, p]))
  const rows = guest
    .filter(g => productsById[g.product_id])
    .map(g => ({
      id: g.id,
      product_id: g.product_id,
      quantity: g.quantity,
      unit_price_snapshot: g.price,
      options_json: g.options_json,
      rental_cart_items: g.rental,
      plaster_service_cart_items: g.plaster,
      products: productsById[g.product_id]
    }))
  cartItems.value = await toCartItems(rows)
}

async function fetchOwnerNames(ids) {
  if (!ids || ids.length === 0) return {}
  const { data, error } = await supabase
    .from('public_user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', Array.from(new Set(ids)))
  if (error) return {}
  const map = {}
  await Promise.all((data || []).map(async (r) => {
    const name = `${r.first_name} ${r.last_name}`.trim()
    const avatar = await signedAvatarUrl(r.avatar_url)
    map[r.id] = { name, avatar_url: avatar }
  }))
  return map
}

function pickPrimaryImage(images = []) {
  if (!Array.isArray(images) || images.length === 0) return null
  const primary = images.find(i => i.is_primary) || images.sort((a, b) => (a.position || 999) - (b.position || 999))[0]
  return primary?.path || null
}

async function signedImageUrl(path) {
  if (!path) {
    return null
  }
  const { data, error } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60)
  if (!error && data?.signedUrl) {
    return data.signedUrl
  }
  const dl = await supabase.storage.from('product-images').download(path)
  if (!dl.error && dl.data) {
    try {
      const url = URL.createObjectURL(dl.data)
      return url
    } catch (e) {
      console.error('signedImageUrl: Error creating object URL:', e)
    }
  }
  return null
}

async function signedAvatarUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60)
  if (!error && data?.signedUrl) return data.signedUrl
  const dl = await supabase.storage.from('avatars').download(path)
  if (!dl.error && dl.data) {
    try { return URL.createObjectURL(dl.data) } catch {}
  }
  return null
}

export function getCartItems() {
  return cartItems
}

export function getCartCount() {
  return cartItems.value.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Agrega un producto al carrito
 * @param {Object} productData - Datos del producto
 * @param {string} productData.id - ID del producto
 * @param {string} productData.product_type - SUPPLY | PROSTHESIS | RENTAL | PLASTER_SERVICE
 * @param {number} productData.price - Precio unitario
 * @param {number} productData.quantity - Cantidad
 * @param {Object} typeSpecificData - Datos específicos del tipo de producto
 */
export async function addToCart(productData, typeSpecificData = {}) {
  try {
    const item = {
      product_id: productData.id,
      product_type: productData.product_type,
      quantity: productData.quantity || 1,
      price: productData.price,
      options_json: typeSpecificData.options_json || null,
      rental: typeSpecificData.rental || null,
      plaster: typeSpecificData.plaster || null
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return addToGuestCart(item)

    const cartId = await initializeCart(user.id)
    if (!cartId) throw new Error('No se pudo inicializar el carrito')

    // Checked in the database: the in-memory cart may not be loaded yet right after opening a page
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', item.product_id)
      .limit(1)
      .maybeSingle()
    if (existingError) throw existingError

    if (existingItem && item.product_type === 'SUPPLY') {
      await updateQuantity(existingItem.id, existingItem.quantity + item.quantity)
      return { success: true, message: 'Cantidad actualizada' }
    }

    await insertCartItem(cartId, item)
    await fetchCartItems(user.id)

    return { success: true, message: 'Producto agregado al carrito' }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return { success: false, message: error.message }
  }
}

async function addToGuestCart(item) {
  const items = readGuestCart()
  const existing = items.find(i => i.product_id === item.product_id)
  let message = 'Producto agregado al carrito'

  if (existing && item.product_type === 'SUPPLY') {
    existing.quantity += item.quantity
    message = 'Cantidad actualizada'
  } else {
    items.push({ id: crypto.randomUUID(), ...item })
  }

  writeGuestCart(items)
  await loadGuestItems()
  return { success: true, message }
}

async function insertCartItem(cartId, item) {
  const { data: cartItem, error: itemError } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_snapshot: item.price,
      options_json: item.options_json
    })
    .select('id')
    .single()

  if (itemError) throw itemError

  if (item.product_type === 'RENTAL' && item.rental) {
    const { error: rentalError } = await supabase
      .from('rental_cart_items')
      .insert({
        cart_item_id: cartItem.id,
        start_date: item.rental.start_date,
        end_date: item.rental.end_date,
        start_time: item.rental.start_time,
        end_time: item.rental.end_time,
        total_days: item.rental.total_days,
        calculated_price: item.rental.calculated_price
      })

    if (rentalError) throw rentalError
  }

  if (item.product_type === 'PLASTER_SERVICE' && item.plaster) {
    const { error: plasterError } = await supabase
      .from('plaster_service_cart_items')
      .insert({
        cart_item_id: cartItem.id,
        custom_description: item.plaster.custom_description
      })

    if (plasterError) throw plasterError
  }
}

// Moves the items added without session to the user's cart in Supabase
async function mergeGuestCart(userId) {
  const guest = readGuestCart()
  if (guest.length === 0) return

  writeGuestCart([])
  const cartId = await initializeCart(userId)
  if (!cartId) return

  await fetchCartItems(userId)
  for (const item of guest) {
    const existing = cartItems.value.find(i => i.product_id === item.product_id)
    try {
      if (existing && item.product_type === 'SUPPLY') {
        await supabase.from('cart_items').update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id)
      } else {
        await insertCartItem(cartId, item)
      }
    } catch (error) {
      console.error('Error moving guest item to cart:', error)
    }
  }
}

export async function removeFromCart(itemId) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      writeGuestCart(readGuestCart().filter(i => i.id !== itemId))
      await loadGuestItems()
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    await fetchCartItems(user.id)
  } catch (error) {
    console.error('Error removing from cart:', error)
  }
}

export async function updateQuantity(itemId, quantity) {
  try {
    if (quantity <= 0) {
      await removeFromCart(itemId)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      writeGuestCart(readGuestCart().map(i => (i.id === itemId ? { ...i, quantity } : i)))
      await loadGuestItems()
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)

    if (error) throw error

    await fetchCartItems(user.id)
  } catch (error) {
    console.error('Error updating quantity:', error)
  }
}

export async function clearCart() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const cartId = await initializeCart(user.id)
    if (!cartId) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)

    if (error) throw error

    cartItems.value = []
  } catch (error) {
    console.error('Error clearing cart:', error)
  }
}

export function getCartTotal() {
  return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
}

/**
 * Sincroniza el carrito al cargar la aplicación
 */
export async function syncCartWithSupabase() {
  // Navbar calls this on every auth change; avoid merging the guest cart twice
  if (syncing) return syncing
  syncing = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await mergeGuestCart(user.id)
        await fetchCartItems(user.id)
      } else {
        await loadGuestItems()
      }
    } catch (error) {
      console.error('Error syncing cart:', error)
    } finally {
      syncing = null
    }
  })()
  return syncing
}
