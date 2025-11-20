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
  // Load base product with all related tables
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, product_type, owner_user_id, created_at,
      supply_products(unit_price, unit_label, stock_qty),
      prosthesis_products(material_id, manufacturing_days),
      plaster_service_products(base_price, notes, manufacturing_days),
      rental_products(stock_qty, refundable_deposit_amount),
      product_images(path, is_primary, position)
    `)
    .eq('id', id)
    .limit(1)
  if (error) throw error
  if (!Array.isArray(data) || data.length === 0) return null

  const p = data[0]

  // Load image
  let imgPath = pickPrimaryImage(p.product_images || [])
  if (!imgPath) {
    imgPath = await guessImagePath(p.owner_user_id, p.id)
  }
  const image = await signedImageUrl(imgPath)

  // Load owner
  const owners = await fetchOwnerNames([p.owner_user_id])
  const owner = owners[p.owner_user_id] || { name: 'Vendedor', avatar_url: null }

  // Base result
  const result = {
    id: p.id,
    name: p.name,
    description: p.description,
    product_type: p.product_type,
    image,
    seller: {
      id: p.owner_user_id,
      username: owner.name,
      rating: 0,
      sales_count: 0,
      avatar_url: owner.avatar_url,
      location: ''
    },
  }

  // Add type-specific data
  if (p.product_type === 'SUPPLY') {
    const supply = p.supply_products || {}
    result.price = supply.unit_price || 0
    result.unit = supply.unit_label || 'unit'
    result.stock = supply.stock_qty ?? null
  } else if (p.product_type === 'PROSTHESIS') {
    const prosthesis = p.prosthesis_products || {}
    result.material_id = prosthesis.material_id
    result.manufacturing_days = prosthesis.manufacturing_days

    // Load pricing matrix
    const { data: prices } = await supabase
      .from('product_prices')
      .select('work_type_id, tooth_group_id, unit_price')
      .eq('product_id', id)

    result.pricing_matrix = prices || []
  } else if (p.product_type === 'PLASTER_SERVICE') {
    const service = p.plaster_service_products || {}
    result.base_price = service.base_price || 0
    result.notes = service.notes
    result.manufacturing_days = service.manufacturing_days
  } else if (p.product_type === 'RENTAL') {
    const rental = p.rental_products || {}
    result.stock = rental.stock_qty ?? null
    result.deposit = rental.refundable_deposit_amount || 0

    // Load rental pricing
    const { data: pricing } = await supabase
      .from('rental_pricing')
      .select('period, price')
      .eq('product_id', id)

    result.rental_pricing = pricing || []
  }

  return result
}

export async function listShippingMethods() {
  const { data: me } = await supabase.auth.getUser()
  const uid = me?.user?.id
  if (!uid) return []
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('id, name, active')
    .eq('seller_user_id', uid)
    .order('name', { ascending: true })
  if (error) return []
  return data || []
}

export async function getShippingMethodById(id) {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('id, name, active, volume_min_cm3, volume_max_cm3')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createShippingMethod(name, active = true, extraFields = {}) {
  const { data: me } = await supabase.auth.getUser()
  const uid = me?.user?.id
  if (!uid) throw new Error('No auth user')
  const insert = { seller_user_id: uid, name, active, ...extraFields }
  const { data, error } = await supabase
    .from('shipping_methods')
    .insert(insert)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function linkProductShippingMethod(productId, methodId) {
  const { error } = await supabase
    .from('product_shipping_methods')
    .insert({ product_id: productId, method_id: methodId })
  if (error) throw error
  return true
}

export async function updateShippingMethod(id, fields) {
  const { error } = await supabase
    .from('shipping_methods')
    .update(fields)
    .eq('id', id)
  if (error) throw error
  return true
}

export async function countShippingMethodUsage(methodId) {
  const { count, error } = await supabase
    .from('product_shipping_methods')
    .select('product_id', { count: 'exact', head: true })
    .eq('method_id', methodId)
  if (error) throw error
  return count || 0
}

export async function updateProduct(id, fields) {
  const { error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)
  if (error) throw error
  return true
}

export async function deleteProductById(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

export async function pauseProductsByShippingMethod(methodId) {
  const idsRes = await supabase
    .from('product_shipping_methods')
    .select('product_id')
    .eq('method_id', methodId)
  if (idsRes.error) throw idsRes.error
  const ids = (idsRes.data || []).map(r => r.product_id)
  if (!ids.length) return 0
  const upd = await supabase
    .from('products')
    .update({ is_active: false })
    .in('id', ids)
  if (upd.error) throw upd.error
  return upd.count || ids.length
}

export async function listProvinces() {
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name, code')
    .order('name', { ascending: true })
  if (error) return []
  return data || []
}

export async function listShippingZones(methodId) {
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('id, zone_name, province_id, postal_code_min, postal_code_max')
    .eq('method_id', methodId)
    .order('zone_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createShippingZone(methodId, zone) {
  const payload = { ...zone, method_id: methodId }
  const { error } = await supabase.from('shipping_zones').insert(payload)
  if (error) throw error
  return true
}

export async function updateShippingZone(id, fields) {
  const { error } = await supabase.from('shipping_zones').update(fields).eq('id', id)
  if (error) throw error
  return true
}

export async function deleteShippingZone(id) {
  const { error } = await supabase.from('shipping_zones').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function listShippingRates(methodId) {
  const { data, error} = await supabase
    .from('shipping_rates')
    .select('id, zone_id, price, weight_min, weight_max, volume_min_cm3, volume_max_cm3, eta_days, active')
    .eq('method_id', methodId)
    .order('price', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createShippingRate(methodId, rate) {
  const payload = { ...rate, method_id: methodId }
  const { error } = await supabase.from('shipping_rates').insert(payload)
  if (error) throw error
  return true
}

export async function updateShippingRate(id, fields) {
  const { error } = await supabase.from('shipping_rates').update(fields).eq('id', id)
  if (error) throw error
  return true
}

export async function deleteShippingRate(id) {
  const { error } = await supabase.from('shipping_rates').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function createSupplyProduct({ name, description, unit_price, unit_label, stock_qty, sku, imageFile, shipping_method_id }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')

  if (!shipping_method_id) {
    throw new Error('SHIPPING_METHOD_REQUIRED')
  }

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
  await linkProductShippingMethod(prod.id, shipping_method_id)
}

export async function createProsthesisProduct({ name, description, imageFile, pricingMatrix, materialId, deliveryTime }) {
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

  // Update material_id and manufacturing_days if provided
  const prosthesisUpdates = {}
  if (materialId) prosthesisUpdates.material_id = materialId
  if (deliveryTime) prosthesisUpdates.manufacturing_days = parseInt(deliveryTime, 10) || null

  if (Object.keys(prosthesisUpdates).length > 0) {
    const { error: matErr } = await supabase
      .from('prosthesis_products')
      .update(prosthesisUpdates)
      .eq('product_id', prod.id)
    if (matErr) throw matErr
  }

  // Save pricing matrix
  if (pricingMatrix) {
    // Load catalogs to map names to IDs
    const workTypes = await loadWorkTypes()
    const toothGroups = await loadToothGroups()

    // Map work type names to IDs
    const workTypeMap = {
      'corona_total': workTypes.find(wt => wt.name.toLowerCase().includes('corona'))?.id,
      'carilla': workTypes.find(wt => wt.name.toLowerCase().includes('carilla'))?.id,
      'incrustacion': workTypes.find(wt => wt.name.toLowerCase().includes('incrusta'))?.id,
      'puente': workTypes.find(wt => wt.name.toLowerCase().includes('puente'))?.id,
    }

    // Map tooth group names to IDs
    const groupMap = {
      'anterior': toothGroups.find(tg => tg.name.toLowerCase().includes('anterior'))?.id,
      'premolar': toothGroups.find(tg => tg.name.toLowerCase().includes('premolar'))?.id,
      'molar': toothGroups.find(tg => tg.name.toLowerCase().includes('molar'))?.id,
    }

    // Build product_prices rows
    const priceRows = []
    for (const [workTypeName, groups] of Object.entries(pricingMatrix)) {
      const workTypeId = workTypeMap[workTypeName]
      if (!workTypeId) continue

      for (const [groupName, price] of Object.entries(groups)) {
        const groupId = groupMap[groupName]
        const numPrice = parseFloat(price)
        if (groupId && numPrice > 0) {
          priceRows.push({
            product_id: prod.id,
            work_type_id: workTypeId,
            tooth_group_id: groupId,
            unit_price: numPrice
          })
        }
      }
    }

    // Insert all price rows
    if (priceRows.length > 0) {
      const { error: priceErr } = await supabase
        .from('product_prices')
        .insert(priceRows)
      if (priceErr) throw priceErr
    }
  }

  // Upload image
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${prod.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr
    const { error: piErr } = await supabase.from('product_images').insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    if (piErr) throw piErr
  }

  return prod.id
}

export async function updateProsthesisProduct(productId, { name, description, imageFile, pricingMatrix, materialId, deliveryTime, is_active }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')

  // Update basic product info
  const productUpdates = {}
  if (name !== undefined) productUpdates.name = name
  if (description !== undefined) productUpdates.description = description
  if (is_active !== undefined) productUpdates.is_active = is_active

  if (Object.keys(productUpdates).length > 0) {
    const { error: prodErr } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('id', productId)
      .eq('owner_user_id', me.user.id) // Security: only owner can update
    if (prodErr) throw prodErr
  }

  // Update prosthesis-specific fields (material_id and manufacturing_days)
  const prosthesisUpdates = {}
  if (materialId !== undefined) prosthesisUpdates.material_id = materialId
  if (deliveryTime !== undefined) prosthesisUpdates.manufacturing_days = parseInt(deliveryTime, 10) || null

  if (Object.keys(prosthesisUpdates).length > 0) {
    const { error: matErr } = await supabase
      .from('prosthesis_products')
      .update(prosthesisUpdates)
      .eq('product_id', productId)
    if (matErr) throw matErr
  }

  // Update pricing matrix if provided
  if (pricingMatrix) {
    // Delete existing prices
    const { error: delErr } = await supabase
      .from('product_prices')
      .delete()
      .eq('product_id', productId)
    if (delErr) throw delErr

    // Re-insert new prices
    const workTypes = await loadWorkTypes()
    const toothGroups = await loadToothGroups()

    const workTypeMap = {
      'corona_total': workTypes.find(wt => wt.name.toLowerCase().includes('corona'))?.id,
      'carilla': workTypes.find(wt => wt.name.toLowerCase().includes('carilla'))?.id,
      'incrustacion': workTypes.find(wt => wt.name.toLowerCase().includes('incrusta'))?.id,
      'puente': workTypes.find(wt => wt.name.toLowerCase().includes('puente'))?.id,
    }

    const groupMap = {
      'anterior': toothGroups.find(tg => tg.name.toLowerCase().includes('anterior'))?.id,
      'premolar': toothGroups.find(tg => tg.name.toLowerCase().includes('premolar'))?.id,
      'molar': toothGroups.find(tg => tg.name.toLowerCase().includes('molar'))?.id,
    }

    const priceRows = []
    for (const [workTypeName, groups] of Object.entries(pricingMatrix)) {
      const workTypeId = workTypeMap[workTypeName]
      if (!workTypeId) continue

      for (const [groupName, price] of Object.entries(groups)) {
        const groupId = groupMap[groupName]
        const numPrice = parseFloat(price)
        if (groupId && numPrice > 0) {
          priceRows.push({
            product_id: productId,
            work_type_id: workTypeId,
            tooth_group_id: groupId,
            unit_price: numPrice
          })
        }
      }
    }

    if (priceRows.length > 0) {
      const { error: priceErr } = await supabase
        .from('product_prices')
        .insert(priceRows)
      if (priceErr) throw priceErr
    }
  }

  // Update image if provided
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${productId}.${ext}`

    // Upload new image (upsert will replace if exists)
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr

    // Update or insert product_images record
    const { data: existing } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single()

    if (existing) {
      // Update existing
      const { error: piErr } = await supabase
        .from('product_images')
        .update({ path: storagePath, alt_text: name })
        .eq('id', existing.id)
      if (piErr) throw piErr
    } else {
      // Insert new
      const { error: piErr } = await supabase
        .from('product_images')
        .insert({ product_id: productId, path: storagePath, alt_text: name, position: 1, is_primary: true })
      if (piErr) throw piErr
    }
  }

  return true
}

export async function updateSupplyProduct(productId, { name, description, unit_price, unit_label, stock_qty, sku, imageFile, is_active }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')

  // Update basic product info
  const productUpdates = {}
  if (name !== undefined) productUpdates.name = name
  if (description !== undefined) productUpdates.description = description
  if (is_active !== undefined) productUpdates.is_active = is_active

  if (Object.keys(productUpdates).length > 0) {
    const { error: prodErr } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('id', productId)
      .eq('owner_user_id', me.user.id)
    if (prodErr) throw prodErr
  }

  // Update supply-specific fields
  const supplyUpdates = {}
  if (unit_price !== undefined) supplyUpdates.unit_price = parseFloat(unit_price)
  if (unit_label !== undefined) supplyUpdates.unit_label = unit_label
  if (stock_qty !== undefined) supplyUpdates.stock_qty = parseFloat(stock_qty)
  if (sku !== undefined) supplyUpdates.sku = sku

  if (Object.keys(supplyUpdates).length > 0) {
    const { error: supErr } = await supabase
      .from('supply_products')
      .update(supplyUpdates)
      .eq('product_id', productId)
    if (supErr) throw supErr
  }

  // Update image if provided
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${productId}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr

    const { data: existing } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single()

    if (existing) {
      const { error: piErr } = await supabase
        .from('product_images')
        .update({ path: storagePath, alt_text: name })
        .eq('id', existing.id)
      if (piErr) throw piErr
    } else {
      const { error: piErr } = await supabase
        .from('product_images')
        .insert({ product_id: productId, path: storagePath, alt_text: name, position: 1, is_primary: true })
      if (piErr) throw piErr
    }
  }

  return true
}

export async function updatePlasterServiceProduct(productId, { name, description, base_price, deliveryTime, imageFile, is_active }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')

  // Update basic product info
  const productUpdates = {}
  if (name !== undefined) productUpdates.name = name
  if (description !== undefined) productUpdates.description = description
  if (is_active !== undefined) productUpdates.is_active = is_active

  if (Object.keys(productUpdates).length > 0) {
    const { error: prodErr } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('id', productId)
      .eq('owner_user_id', me.user.id)
    if (prodErr) throw prodErr
  }

  // Update plaster service specific fields
  const plasterUpdates = {}
  if (base_price !== undefined) plasterUpdates.base_price = parseFloat(base_price)
  if (deliveryTime !== undefined) plasterUpdates.manufacturing_days = parseInt(deliveryTime, 10) || null

  if (Object.keys(plasterUpdates).length > 0) {
    const { error: plErr } = await supabase
      .from('plaster_service_products')
      .update(plasterUpdates)
      .eq('product_id', productId)
    if (plErr) throw plErr
  }

  // Update image if provided
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${productId}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr

    const { data: existing } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single()

    if (existing) {
      const { error: piErr } = await supabase
        .from('product_images')
        .update({ path: storagePath, alt_text: name })
        .eq('id', existing.id)
      if (piErr) throw piErr
    } else {
      const { error: piErr } = await supabase
        .from('product_images')
        .insert({ product_id: productId, path: storagePath, alt_text: name, position: 1, is_primary: true })
      if (piErr) throw piErr
    }
  }

  return true
}

export async function updateRentalProduct(productId, { name, description, stock_qty, priceDay, priceWeek, priceMonth, imageFile, is_active }) {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')

  // Update basic product info
  const productUpdates = {}
  if (name !== undefined) productUpdates.name = name
  if (description !== undefined) productUpdates.description = description
  if (is_active !== undefined) productUpdates.is_active = is_active

  if (Object.keys(productUpdates).length > 0) {
    const { error: prodErr } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('id', productId)
      .eq('owner_user_id', me.user.id)
    if (prodErr) throw prodErr
  }

  // Update rental specific fields
  if (stock_qty !== undefined) {
    const { error: renErr } = await supabase
      .from('rental_products')
      .update({ stock_qty: parseInt(stock_qty) })
      .eq('product_id', productId)
    if (renErr) throw renErr
  }

  // Update pricing if provided
  if (priceDay !== undefined || priceWeek !== undefined || priceMonth !== undefined) {
    // Delete existing pricing
    const { error: delErr } = await supabase
      .from('rental_pricing')
      .delete()
      .eq('product_id', productId)
    if (delErr) throw delErr

    // Re-insert new pricing
    const pricing = []
    if (priceDay) pricing.push({ product_id: productId, period: '1 day', price: parseFloat(priceDay) })
    if (priceWeek) pricing.push({ product_id: productId, period: '7 days', price: parseFloat(priceWeek) })
    if (priceMonth) pricing.push({ product_id: productId, period: '30 days', price: parseFloat(priceMonth) })

    if (pricing.length > 0) {
      const { error: priceErr } = await supabase
        .from('rental_pricing')
        .insert(pricing)
      if (priceErr) throw priceErr
    }
  }

  // Update image if provided
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${productId}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr

    const { data: existing } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single()

    if (existing) {
      const { error: piErr } = await supabase
        .from('product_images')
        .update({ path: storagePath, alt_text: name })
        .eq('id', existing.id)
      if (piErr) throw piErr
    } else {
      const { error: piErr } = await supabase
        .from('product_images')
        .insert({ product_id: productId, path: storagePath, alt_text: name, position: 1, is_primary: true })
      if (piErr) throw piErr
    }
  }

  return true
}

export async function createPlasterServiceProduct({ name, description, base_price, deliveryTime, imageFile }) {
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

  const plasterUpdates = { base_price }
  if (deliveryTime) plasterUpdates.manufacturing_days = parseInt(deliveryTime, 10) || null

  const { error: upd } = await supabase.from('plaster_service_products').update(plasterUpdates).eq('product_id', prod.id)
  if (upd) throw upd
  if (imageFile) {
    const type = (imageFile.type || 'image/png').toLowerCase()
    const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
    const storagePath = `${me.user.id}/${prod.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(storagePath, imageFile, { contentType: type, upsert: true })
    if (upErr) throw upErr
    const { error: piErr } = await supabase.from('product_images').insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    if (piErr) throw piErr
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
    if (upErr) throw upErr
    const { error: piErr } = await supabase.from('product_images').insert({ product_id: prod.id, path: storagePath, alt_text: name, position: 1, is_primary: true })
    if (piErr) throw piErr
  }
  return prod.id
}

// Catalog loaders
export async function loadMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data || []
}

export async function loadWorkTypes() {
  const { data, error } = await supabase
    .from('work_types')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data || []
}

export async function loadToothGroups() {
  const { data, error } = await supabase
    .from('tooth_groups')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data || []
}

export async function loadTeeth() {
  const { data, error } = await supabase
    .from('teeth')
    .select('id, fdi_code, tooth_group_id')
    .order('fdi_code')
  if (error) throw error
  return data || []
}

export async function loadValidWorkGroupCombinations() {
  const { data, error } = await supabase
    .from('work_type_tooth_group_combinations')
    .select('work_type_id, tooth_group_id')
  if (error) throw error
  return data || []
}
