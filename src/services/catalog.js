import { supabase } from './supabase'
import { getCached, setCached } from './cache'
import { resolveProductImage } from './product-images'
import { fetchOwnerNames } from './product-owners'

export async function listActiveProducts() {
  const cacheKey = 'products:active'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, product_type, owner_user_id, created_at,
      supply_products(unit_price, unit_label, stock_qty),
      plaster_service_products(base_price),
      rental_products(stock_qty),
      product_images(path, is_primary, position)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  const ownerIds = data.map(p => p.owner_user_id)
  const owners = await fetchOwnerNames(ownerIds)

  // Precios de alquiler en una sola consulta (antes era una por producto)
  const rentalIds = data.filter(p => p.product_type === 'RENTAL').map(p => p.id)
  const rentalPrices = {}
  if (rentalIds.length) {
    const { data: pricing } = await supabase
      .from('rental_pricing')
      .select('product_id, period, price')
      .in('product_id', rentalIds)
    ;(pricing || []).forEach(r => {
      rentalPrices[r.product_id] = rentalPrices[r.product_id] || []
      rentalPrices[r.product_id].push(r)
    })
  }

  const results = await Promise.all(data.map(async (p) => {
    const image = await resolveProductImage(p)
    const owner = owners[p.owner_user_id] || { name: 'Vendedor', avatar_url: null }

    const result = {
      id: p.id,
      name: p.name,
      description: p.description,
      product_type: p.product_type,
      created_at: p.created_at,
      image: image,
      seller: { id: p.owner_user_id, username: owner.name, rating: 0, sales_count: 0, avatar_url: owner.avatar_url },
    }

    if (p.product_type === 'SUPPLY') {
      const supply = p.supply_products || {}
      result.price = supply.unit_price || 0
      result.unit = supply.unit_label || 'unidad'
      result.stock = supply.stock_qty ?? null
    } else if (p.product_type === 'PLASTER_SERVICE') {
      const plaster = p.plaster_service_products || {}
      result.price = plaster.base_price || 0
    } else if (p.product_type === 'RENTAL') {
      const pricing = rentalPrices[p.id] || []
      const byPeriod = (period) => pricing.find(pr => pr.period === period)?.price || null
      const cheapest = pricing.length ? Math.min(...pricing.map(pr => Number(pr.price) || 0)) : 0
      result.price_day = byPeriod('1 day') || cheapest
      result.price_week = byPeriod('7 days')
      result.price_month = byPeriod('30 days')
      result.stock = p.rental_products?.stock_qty ?? null
    }

    return result
  }))

  setCached(cacheKey, results)
  return results
}

export async function listActiveServices() {
  const cacheKey = 'services:active'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, product_type, owner_user_id, created_at,
      prosthesis_products(material_id, manufacturing_days),
      plaster_service_products(base_price, manufacturing_days),
      rental_products(stock_qty),
      product_images(path, is_primary, position)
    `)
    .eq('is_active', true)
    .in('product_type', ['PROSTHESIS', 'PLASTER_SERVICE', 'RENTAL'])
    .order('created_at', { ascending: false })

  if (error) throw error

  const ownerIds = data.map(p => p.owner_user_id)
  const owners = await fetchOwnerNames(ownerIds)

  const results = await Promise.all(data.map(async (p) => {
    const image = await resolveProductImage(p)
    const owner = owners[p.owner_user_id] || { name: 'Vendedor', avatar_url: null }

    const base = {
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
        avatar_url: owner.avatar_url
      }
    }

    if (p.product_type === 'PROSTHESIS') {
      const prosthesis = p.prosthesis_products || {}
      base.delivery_time = prosthesis.manufacturing_days ? `${prosthesis.manufacturing_days} días` : null
      base.category = 'Prótesis por encargo'

      const { data: prices } = await supabase
        .from('product_prices')
        .select('unit_price')
        .eq('product_id', p.id)
        .order('unit_price', { ascending: true })
        .limit(1)

      base.price = prices && prices.length > 0 ? prices[0].unit_price : 0
    } else if (p.product_type === 'PLASTER_SERVICE') {
      const service = p.plaster_service_products || {}
      base.price = service.base_price || 0
      base.delivery_time = service.manufacturing_days ? `${service.manufacturing_days} días` : null
      base.category = 'Modelado y vaciado'
    } else if (p.product_type === 'RENTAL') {
      const rental = p.rental_products || {}
      base.stock = rental.stock_qty ?? null
      base.category = 'Alquiler de equipos'

      const { data: pricing } = await supabase
        .from('rental_pricing')
        .select('period, price')
        .eq('product_id', p.id)
        .order('price', { ascending: true })

      base.rental_pricing = pricing || []
      if (pricing && pricing.length > 0) {
        const dayPrice = pricing.find(pr => pr.period === '1 day')
        const weekPrice = pricing.find(pr => pr.period === '7 days')
        const monthPrice = pricing.find(pr => pr.period === '30 days')

        base.price_day = dayPrice?.price || 0
        base.price_week = weekPrice?.price || null
        base.price_month = monthPrice?.price || null
      }
    }

    return base
  }))

  setCached(cacheKey, results)
  return results
}

export async function listMyProducts() {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, product_type, owner_user_id, created_at, is_active,
      supply_products(unit_price, unit_label, stock_qty),
      plaster_service_products(base_price),
      rental_products(stock_qty),
      product_images(path, is_primary, position)
    `)
    .eq('owner_user_id', me.user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  const owners = await fetchOwnerNames([me.user.id])
  return Promise.all((data || []).map(async (p) => {
    const image = await resolveProductImage(p)
    const supply = p.supply_products || {}
    const plaster = p.plaster_service_products || {}
    const owner = owners[p.owner_user_id] || { name: 'Vos', avatar_url: null }

    const result = {
      id: p.id,
      name: p.name,
      description: p.description,
      product_type: p.product_type,
      is_active: p.is_active,
      image,
      seller: { id: p.owner_user_id, username: owner.name, avatar_url: owner.avatar_url }
    }

    if (p.product_type === 'SUPPLY') {
      result.price = supply.unit_price || 0
      result.unit = supply.unit_label || 'unidad'
      result.stock = supply.stock_qty ?? null
    } else if (p.product_type === 'PLASTER_SERVICE') {
      result.price = plaster.base_price || 0
    } else if (p.product_type === 'RENTAL') {
      const { data: pricing } = await supabase
        .from('rental_pricing')
        .select('period, price')
        .eq('product_id', p.id)
        .order('price', { ascending: true })
        .limit(1)
      result.price_day = pricing?.[0]?.price || 0
    }

    return result
  }))
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, product_type, owner_user_id, created_at, is_active,
      supply_products(unit_price, unit_label, stock_qty, sku),
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
  const image = await resolveProductImage(p)

  const owners = await fetchOwnerNames([p.owner_user_id])
  const owner = owners[p.owner_user_id] || { name: 'Vendedor', avatar_url: null }

  const result = {
    id: p.id,
    name: p.name,
    description: p.description,
    product_type: p.product_type,
    is_active: p.is_active,
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

  if (p.product_type === 'SUPPLY') {
    const supply = p.supply_products || {}
    result.price = supply.unit_price || 0
    result.unit = supply.unit_label || 'unidad'
    result.stock = supply.stock_qty ?? null
    result.sku = supply.sku || null
  } else if (p.product_type === 'PROSTHESIS') {
    const prosthesis = p.prosthesis_products || {}
    result.material_id = prosthesis.material_id
    result.manufacturing_days = prosthesis.manufacturing_days

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
    result.stock_qty = rental.stock_qty ?? null
    result.refundable_deposit_amount = rental.refundable_deposit_amount || 0

    const { data: pricing } = await supabase
      .from('rental_pricing')
      .select('period, price')
      .eq('product_id', id)
      .order('price', { ascending: true })

    result.rental_pricing = pricing || []

    if (pricing && pricing.length > 0) {
      const dayPrice = pricing.find(pr => pr.period === '1 day')
      result.daily_price = dayPrice?.price || (pricing[0]?.price || 0)
    } else {
      result.daily_price = 0
    }
  }

  return result
}

export async function listProvinces() {
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name, code')
    .order('name', { ascending: true })
  if (error) return []
  return data || []
}
