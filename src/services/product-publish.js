import { supabase } from './supabase'
import { clearCache } from './cache'
import { uploadNewProductImage } from './product-images'
import { priceRowsFromMatrix } from './prosthesis-pricing'

async function currentUserId() {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) throw new Error('No auth user')
  return me.user.id
}

async function insertProduct(name, description, productType, ownerId) {
  const insert = {
    name,
    description,
    product_type: productType,
    owner_user_id: ownerId,
    is_active: true,
  }
  const { data: prod, error: perr } = await supabase.from('products').insert(insert).select('id').single()
  if (perr) throw perr
  return prod
}

export async function linkProductShippingMethod(productId, methodId) {
  const { error } = await supabase
    .from('product_shipping_methods')
    .insert({ product_id: productId, method_id: methodId })
  if (error) throw error
  return true
}

export async function createSupplyProduct({ name, description, unit_price, unit_label, stock_qty, sku, imageFile, shipping_method_id }) {
  const ownerId = await currentUserId()

  if (!shipping_method_id) {
    throw new Error('SHIPPING_METHOD_REQUIRED')
  }

  const prod = await insertProduct(name, description, 'SUPPLY', ownerId)

  const { error: serr } = await supabase
    .from('supply_products')
    .update({ unit_price, unit_label, stock_qty, sku })
    .eq('product_id', prod.id)
  if (serr) throw serr

  if (imageFile) await uploadNewProductImage(ownerId, prod.id, imageFile, name)
  await linkProductShippingMethod(prod.id, shipping_method_id)
  clearCache('products:active')
}

export async function createProsthesisProduct({ name, description, imageFile, pricingMatrix, materialId, deliveryTime }) {
  const ownerId = await currentUserId()
  const prod = await insertProduct(name, description, 'PROSTHESIS', ownerId)

  const prosthesisUpdates = {}
  // Solo actualizar material_id si es un UUID válido
  if (materialId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materialId)) {
    prosthesisUpdates.material_id = materialId
  }
  if (deliveryTime) prosthesisUpdates.manufacturing_days = parseInt(deliveryTime, 10) || null

  if (Object.keys(prosthesisUpdates).length > 0) {
    const { error: matErr } = await supabase
      .from('prosthesis_products')
      .update(prosthesisUpdates)
      .eq('product_id', prod.id)
    if (matErr) throw matErr
  }

  if (pricingMatrix) {
    const priceRows = await priceRowsFromMatrix(prod.id, pricingMatrix)
    if (priceRows.length > 0) {
      const { error: priceErr } = await supabase
        .from('product_prices')
        .insert(priceRows)
      if (priceErr) throw priceErr
    }
  }

  if (imageFile) await uploadNewProductImage(ownerId, prod.id, imageFile, name)

  clearCache('services:active')
  clearCache('products:active')
  return prod.id
}

export async function createPlasterServiceProduct({ name, description, base_price, deliveryTime, imageFile }) {
  const ownerId = await currentUserId()
  const prod = await insertProduct(name, description, 'PLASTER_SERVICE', ownerId)

  const plasterUpdates = { base_price }
  if (deliveryTime) plasterUpdates.manufacturing_days = parseInt(deliveryTime, 10) || null

  const { error: upd } = await supabase.from('plaster_service_products').update(plasterUpdates).eq('product_id', prod.id)
  if (upd) throw upd
  if (imageFile) await uploadNewProductImage(ownerId, prod.id, imageFile, name)
  clearCache('services:active')
  clearCache('products:active')
  return prod.id
}

export async function createRentalProduct({ name, description, stock_qty, priceDay, priceWeek, priceMonth, imageFile }) {
  const ownerId = await currentUserId()
  const prod = await insertProduct(name, description, 'RENTAL', ownerId)

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
  if (imageFile) await uploadNewProductImage(ownerId, prod.id, imageFile, name)
  clearCache('services:active')
  clearCache('products:active')
  return prod.id
}
