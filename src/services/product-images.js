import { supabase } from './supabase'

export function pickPrimaryImage(images = []) {
  if (!Array.isArray(images) || images.length === 0) return null
  const primary = images.find(i => i.is_primary) || images.sort((a, b) => (a.position || 999) - (b.position || 999))[0]
  return primary?.path || null
}

export async function signedImageUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60)
  if (!error && data?.signedUrl) return data.signedUrl
  const dl = await supabase.storage.from('product-images').download(path)
  if (!dl.error && dl.data) {
    try { return URL.createObjectURL(dl.data) } catch {}
  }
  return null
}

export async function guessImagePath(ownerId, productId) {
  try {
    const { data, error } = await supabase.storage.from('product-images').list(`${ownerId}`, { limit: 100 })
    if (error || !Array.isArray(data)) return null
    const found = data.find(obj => obj.name?.includes(productId))
    return found ? `${ownerId}/${found.name}` : null
  } catch { return null }
}

export async function resolveProductImage(product) {
  let imgPath = pickPrimaryImage(product.product_images || [])
  if (!imgPath) imgPath = await guessImagePath(product.owner_user_id, product.id)
  return signedImageUrl(imgPath)
}

function imageStoragePath(ownerId, productId, imageFile) {
  const type = (imageFile.type || 'image/png').toLowerCase()
  const ext = type.includes('jpeg') ? 'jpg' : type.split('/')[1] || 'png'
  return { type, storagePath: `${ownerId}/${productId}.${ext}` }
}

export async function uploadNewProductImage(ownerId, productId, imageFile, altText) {
  const { type, storagePath } = imageStoragePath(ownerId, productId, imageFile)
  const { error: upErr } = await supabase.storage
    .from('product-images')
    .upload(storagePath, imageFile, { contentType: type, upsert: true })
  if (upErr) throw upErr
  const { error: piErr } = await supabase
    .from('product_images')
    .insert({ product_id: productId, path: storagePath, alt_text: altText, position: 1, is_primary: true })
  if (piErr) throw piErr
}

export async function savePrimaryImage(productId, imageFile, altText) {
  const { data: product, error: ownerErr } = await supabase
    .from('products')
    .select('owner_user_id')
    .eq('id', productId)
    .single()
  if (ownerErr) throw ownerErr

  const { type, storagePath } = imageStoragePath(product.owner_user_id, productId, imageFile)

  const { error: upErr } = await supabase.storage
    .from('product-images')
    .upload(storagePath, imageFile, { contentType: type, upsert: true })
  if (upErr) throw upErr

  const { data: existing } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('is_primary', true)
    .maybeSingle()

  const { error: piErr } = existing
    ? await supabase.from('product_images').update({ path: storagePath, alt_text: altText }).eq('id', existing.id)
    : await supabase.from('product_images').insert({ product_id: productId, path: storagePath, alt_text: altText, position: 1, is_primary: true })
  if (piErr) throw piErr
}

/**
 * Miniaturas firmadas para varios productos a la vez: { [productId]: url }.
 * Se usa en el detalle de compra y en Mis ventas.
 */
export async function getProductThumbnails(productIds = []) {
  const ids = [...new Set(productIds.filter(Boolean))]
  if (!ids.length) return {}
  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, path, is_primary, position')
    .in('product_id', ids)
  if (error) return {}
  const byProduct = {}
  for (const img of data || []) {
    (byProduct[img.product_id] = byProduct[img.product_id] || []).push(img)
  }
  const entries = await Promise.all(ids.map(async id => [id, await signedImageUrl(pickPrimaryImage(byProduct[id] || []))]))
  return Object.fromEntries(entries.filter(([, url]) => url))
}
