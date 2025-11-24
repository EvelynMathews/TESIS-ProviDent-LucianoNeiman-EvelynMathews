/**
 * Servicio de gestión del carrito de compras integrado con Supabase.
 * Propósito: Almacenar de forma reactiva los ítems que el usuario agrega
 * a su carrito antes de finalizar la compra.
 * Funcionamiento: Mantiene un array `cartItems` reactivo (Vue ref) que se
 * sincroniza con Supabase. Proporciona funciones CRUD para que los
 * componentes de la aplicación accedan y modifiquen el carrito.
 */

import { ref } from 'vue'
import { supabase } from './supabase'

const cartItems = ref([])
let currentUserId = null

/**
 * Inicializa el carrito para un usuario específico
 * Crea un carrito si no existe, o retorna el existente
 */
async function initializeCart(userId) {
  if (!userId) return null

  currentUserId = userId

  const { data: existingCart, error: fetchError } = await supabase
    .from('carts')
    .select('id')
    .eq('buyer_user_id', userId)
    .single()

  if (existingCart) {
    return existingCart.id
  }

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching cart:', fetchError)
    return null
  }

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
        products (
          id,
          name,
          description,
          product_type,
          owner_user_id,
          supply_products (unit_label),
          product_images (path, is_primary, position)
        ),
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

    const ownerIds = data.map(item => item.products.owner_user_id).filter(Boolean)
    const owners = await fetchOwnerNames(ownerIds)

    cartItems.value = await Promise.all(data.map(async (item) => {
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
  } catch (error) {
    console.error('Error in fetchCartItems:', error)
  }
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
  if (!path) return null
  const { data, error } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60)
  if (!error && data?.signedUrl) return data.signedUrl
  const dl = await supabase.storage.from('product-images').download(path)
  if (!dl.error && dl.data) {
    try { return URL.createObjectURL(dl.data) } catch {}
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const cartId = await initializeCart(user.id)
    if (!cartId) throw new Error('No se pudo inicializar el carrito')

    const existingItem = cartItems.value.find(i => i.product_id === productData.id)

    if (existingItem && productData.product_type === 'SUPPLY') {
      await updateQuantity(existingItem.id, existingItem.quantity + (productData.quantity || 1))
      return { success: true, message: 'Cantidad actualizada' }
    }

    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productData.id,
        quantity: productData.quantity || 1,
        unit_price_snapshot: productData.price,
        options_json: typeSpecificData.options_json || null
      })
      .select('id')
      .single()

    if (itemError) throw itemError

    if (productData.product_type === 'RENTAL' && typeSpecificData.rental) {
      const { error: rentalError } = await supabase
        .from('rental_cart_items')
        .insert({
          cart_item_id: cartItem.id,
          start_date: typeSpecificData.rental.start_date,
          end_date: typeSpecificData.rental.end_date,
          start_time: typeSpecificData.rental.start_time,
          end_time: typeSpecificData.rental.end_time,
          total_days: typeSpecificData.rental.total_days,
          calculated_price: typeSpecificData.rental.calculated_price
        })

      if (rentalError) throw rentalError
    }

    if (productData.product_type === 'PLASTER_SERVICE' && typeSpecificData.plaster) {
      const { error: plasterError } = await supabase
        .from('plaster_service_cart_items')
        .insert({
          cart_item_id: cartItem.id,
          custom_description: typeSpecificData.plaster.custom_description
        })

      if (plasterError) throw plasterError
    }

    await fetchCartItems(user.id)

    return { success: true, message: 'Producto agregado al carrito' }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return { success: false, message: error.message }
  }
}

export async function removeFromCart(itemId) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (quantity <= 0) {
      await removeFromCart(itemId)
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
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await fetchCartItems(user.id)
    }
  } catch (error) {
    console.error('Error syncing cart:', error)
  }
}
