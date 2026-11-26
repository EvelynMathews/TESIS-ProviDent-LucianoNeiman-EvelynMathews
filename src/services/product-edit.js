import { supabase } from './supabase'
import { clearCache } from './cache'
import { savePrimaryImage } from './product-images'
import { priceRowsFromMatrix } from './prosthesis-pricing'

export async function updateProduct(id, fields) {
  const { data, error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para modificar este producto')
  clearCache('products:active')
  clearCache('services:active')
  return true
}

export async function deleteProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para eliminar este producto')
  clearCache('products:active')
  clearCache('services:active')
  return true
}

async function updateBaseFields(productId, { name, description, is_active }) {
  const productUpdates = {}
  if (name !== undefined) productUpdates.name = name
  if (description !== undefined) productUpdates.description = description
  if (is_active !== undefined) productUpdates.is_active = is_active

  if (Object.keys(productUpdates).length > 0) {
    await updateProduct(productId, productUpdates)
  }
}

export async function updateProsthesisProduct(productId, { name, description, imageFile, pricingMatrix, materialId, deliveryTime, is_active }) {
  await updateBaseFields(productId, { name, description, is_active })

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

  if (pricingMatrix) {
    const { error: delErr } = await supabase
      .from('product_prices')
      .delete()
      .eq('product_id', productId)
    if (delErr) throw delErr

    const priceRows = await priceRowsFromMatrix(productId, pricingMatrix)
    if (priceRows.length > 0) {
      const { error: priceErr } = await supabase
        .from('product_prices')
        .insert(priceRows)
      if (priceErr) throw priceErr
    }
  }

  if (imageFile) {
    await savePrimaryImage(productId, imageFile, name)
  }

  clearCache('services:active')
  clearCache('products:active')
  return true
}

export async function updateSupplyProduct(productId, { name, description, unit_price, unit_label, stock_qty, sku, imageFile, is_active }) {
  await updateBaseFields(productId, { name, description, is_active })

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

  if (imageFile) {
    await savePrimaryImage(productId, imageFile, name)
  }

  clearCache('products:active')
  return true
}

export async function updatePlasterServiceProduct(productId, { name, description, base_price, deliveryTime, imageFile, is_active }) {
  await updateBaseFields(productId, { name, description, is_active })

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

  if (imageFile) {
    await savePrimaryImage(productId, imageFile, name)
  }

  clearCache('services:active')
  clearCache('products:active')
  return true
}

export async function updateRentalProduct(productId, { name, description, stock_qty, priceDay, priceWeek, priceMonth, imageFile, is_active }) {
  await updateBaseFields(productId, { name, description, is_active })

  if (stock_qty !== undefined) {
    const { error: renErr } = await supabase
      .from('rental_products')
      .update({ stock_qty: parseInt(stock_qty) })
      .eq('product_id', productId)
    if (renErr) throw renErr
  }

  if (priceDay !== undefined || priceWeek !== undefined || priceMonth !== undefined) {
    const { error: delErr } = await supabase
      .from('rental_pricing')
      .delete()
      .eq('product_id', productId)
    if (delErr) throw delErr

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

  if (imageFile) {
    await savePrimaryImage(productId, imageFile, name)
  }

  clearCache('services:active')
  clearCache('products:active')
  return true
}
