import { supabase } from './supabase'

function pickPrimaryImage(images = []) {
  if (!Array.isArray(images) || images.length === 0) return null
  const primary = images.find(i => i.is_primary) || images.sort((a, b) => (a.position || 999) - (b.position || 999))[0]
  return primary?.path || null
}

async function signedImageUrl(path) {
  if (!path) return null
  // Try signed URL first
  const { data, error } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60)
  if (!error && data?.signedUrl) return data.signedUrl
  // Fallback: download and create object URL (allowed by read policy)
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

async function fetchOwnerNames(ids) {
  if (ids.length === 0) return {}
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

async function guessImagePath(ownerId, productId) {
  // Try to find an object under the seller folder that matches the product id
  try {
    const { data, error } = await supabase.storage.from('product-images').list(`${ownerId}`, { limit: 100 })
    if (error || !Array.isArray(data)) return null
    const found = data.find(obj => obj.name?.includes(productId))
    return found ? `${ownerId}/${found.name}` : null
  } catch { return null }
}

export async function listActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, product_type, owner_user_id, created_at, supply_products(unit_price, unit_label, stock_qty), product_images(path, is_primary, position)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  const ownerIds = data.map(p => p.owner_user_id)
  const owners = await fetchOwnerNames(ownerIds)

  const results = await Promise.all(data.map(async (p) => {
    let imgPath = pickPrimaryImage(p.product_images || [])
    if (!imgPath) {
      imgPath = await guessImagePath(p.owner_user_id, p.id)
    }
    const image = await signedImageUrl(imgPath)
    const supply = p.supply_products || {}
    const owner = owners[p.owner_user_id] || { name: 'Vendedor', avatar_url: null }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      product_type: p.product_type,
      image: image,
      price: supply.unit_price || 0,
      unit: supply.unit_label || 'unit',
      stock: supply.stock_qty ?? null,
      seller: { id: p.owner_user_id, username: owner.name, rating: 0, sales_count: 0, avatar_url: owner.avatar_url },
    }
  }))

  return results
}

export async function listMyProducts() {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, product_type, owner_user_id, created_at, is_active, supply_products(unit_price, unit_label, stock_qty), product_images(path, is_primary, position)')
    .eq('owner_user_id', me.user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  const owners = await fetchOwnerNames([me.user.id])
  return Promise.all((data || []).map(async (p) => {
    let imgPath = pickPrimaryImage(p.product_images || [])
    if (!imgPath) imgPath = await guessImagePath(p.owner_user_id, p.id)
    const image = await signedImageUrl(imgPath)
    const supply = p.supply_products || {}
    const owner = owners[p.owner_user_id] || { name: 'Vos', avatar_url: null }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      product_type: p.product_type,
      is_active: p.is_active,
      image,
      price: supply.unit_price || 0,
      unit: supply.unit_label || 'unidad',
      stock: supply.stock_qty ?? null,
      seller: { id: p.owner_user_id, username: owner.name, avatar_url: owner.avatar_url }
    }
  }))
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, product_type, owner_user_id, created_at, supply_products(unit_price, unit_label, stock_qty), product_images(path, is_primary, position)')
    .eq('id', id)
    .limit(1)
  if (error) throw error
  if (!Array.isArray(data) || data.length === 0) return null
  const p = data[0]
  let imgPath = pickPrimaryImage(p.product_images || [])
  if (!imgPath) {
    imgPath = await guessImagePath(p.owner_user_id, p.id)
  }
  const image = await signedImageUrl(imgPath)
  const supply = p.supply_products || {}
  const owners = await fetchOwnerNames([p.owner_user_id])
  const owner = owners[p.owner_user_id] || { name: 'Vendedor', avatar_url: null }
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    product_type: p.product_type,
    image,
    price: supply.unit_price || 0,
    unit: supply.unit_label || 'unit',
    stock: supply.stock_qty ?? null,
    seller: { id: p.owner_user_id, username: owner.name, rating: 0, sales_count: 0, avatar_url: owner.avatar_url, location: '' },
  }
}

export async function createSupplyProduct({ name, description, unit_price, unit_label, stock_qty, sku, imageFile }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')

  const insert = {
    name,
    description,
    product_type: 'SUPPLY',
    owner_user_id: me.user.id,
    is_active: true,
  }
  const { data: prod, error: perr } = await supabase.from('products').insert(insert).select('id').single()
  if (perr) throw perr

  // Update supply details
  const { error: serr } = await supabase
    .from('supply_products')
    .update({ unit_price, unit_label, stock_qty, sku })
    .eq('product_id', prod.id)
  if (serr) throw serr

  // Image upload
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${prod.id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr
    const { error: piErr } = await supabase
      .from('product_images')
      .insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    if (piErr) throw piErr
}
}

export async function createProsthesisProduct({ name, description, imageFile }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')
  const insert = {
    name,
    description,
    product_type: 'PROSTHESIS',
    owner_user_id: me.user.id,
    is_active: true,
  }
  const { data: prod, error: perr } = await supabase.from('products').insert(insert).select('id').single()
  if (perr) throw perr
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${prod.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (!upErr) {
      await supabase.from('product_images').insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    }
  }
  return prod.id
}

export async function createPlasterServiceProduct({ name, description, base_price, imageFile }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')
  const insert = {
    name,
    description,
    product_type: 'PLASTER_SERVICE',
    owner_user_id: me.user.id,
    is_active: true,
  }
  const { data: prod, error: perr } = await supabase.from('products').insert(insert).select('id').single()
  if (perr) throw perr
  const { error: upd } = await supabase.from('plaster_service_products').update({ base_price }).eq('product_id', prod.id)
  if (upd) throw upd
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${prod.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (!upErr) {
      await supabase.from('product_images').insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    }
  }
  return prod.id
}

export async function createRentalProduct({ name, description, stock_qty, priceDay, priceWeek, priceMonth, imageFile }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')
  const insert = {
    name,
    description,
    product_type: 'RENTAL',
    owner_user_id: me.user.id,
    is_active: true,
  }
  const { data: prod, error: perr } = await supabase.from('products').insert(insert).select('id').single()
  if (perr) throw perr
  const { error: upd } = await supabase.from('rental_products').update({ stock_qty }).eq('product_id', prod.id)
  if (upd) throw upd
  const pricing = []
  if (priceDay) pricing.push({ product_id: prod.id, period: '1 day', price: priceDay })
  if (priceWeek) pricing.push({ product_id: prod.id, period: '7 days', price: priceWeek })
  if (priceMonth) pricing.push({ product_id: prod.id, period: '30 days', price: priceMonth })
  if (pricing.length) {
    const { error: perr2 } = await supabase.from('rental_pricing').insert(pricing)
    if (perr2) throw perr2
  }
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${prod.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (!upErr) {
      await supabase.from('product_images').insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    }
  }
  return prod.id
}
