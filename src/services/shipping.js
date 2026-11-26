/**
 * Servicio de métodos de envío del vendedor.
 * Propósito: Ofrecer una forma simple de configurar envíos (nombre, precio, demora y
 * provincias) sobre las tablas que ya existen en la base.
 * Funcionamiento: Un método (`shipping_methods`) tiene una zona por provincia que cubre
 * (`shipping_zones`) y cada zona tiene su tarifa (`shipping_rates`) con el mismo precio y demora.
 * Guardar reemplaza las zonas y tarifas del método por las nuevas. Los rangos de peso,
 * volumen y código postal no se usan en la app, por eso no se piden: cada zona cubre
 * la provincia completa (código postal 0000 a 9999).
 */
import { supabase } from './supabase'
import { formatMoney } from './format'

const WHOLE_PROVINCE = { postal_code_min: '0000', postal_code_max: '9999' }

const METHOD_FIELDS = `
  id, name, active,
  shipping_zones(id, province_id, zone_name),
  shipping_rates(price, eta_days),
  product_shipping_methods(count)
`

let provincesCache = null

export async function listProvinces() {
  if (provincesCache) return provincesCache
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  provincesCache = data || []
  return provincesCache
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  const uid = data?.user?.id
  if (!uid) throw new Error('Tu sesión expiró. Volvé a iniciar sesión.')
  return uid
}

function toMethod(row, totalProvinces) {
  const zones = row.shipping_zones || []
  const rates = row.shipping_rates || []
  const prices = rates.map(r => Number(r.price))
  const etas = rates.map(r => r.eta_days).filter(n => n !== null && n !== undefined)
  const provinceIds = [...new Set(zones.map(z => z.province_id))]
  return {
    id: row.id,
    name: row.name,
    active: row.active !== false,
    price: prices.length ? Math.min(...prices) : null,
    eta_days: etas.length ? Math.max(...etas) : null,
    province_ids: provinceIds,
    province_names: zones.map(z => z.zone_name).sort((a, b) => a.localeCompare(b)),
    all_country: totalProvinces > 0 && provinceIds.length >= totalProvinces,
    configured: zones.length > 0 && rates.length > 0,
    products_count: row.product_shipping_methods?.[0]?.count || 0
  }
}

export async function listMyShippingMethods() {
  const uid = await currentUserId()
  const [{ data, error }, provinces] = await Promise.all([
    supabase.from('shipping_methods').select(METHOD_FIELDS).eq('seller_user_id', uid).order('name', { ascending: true }),
    listProvinces()
  ])
  if (error) throw error
  return (data || []).map(row => toMethod(row, provinces.length))
}

export async function getShippingMethod(id) {
  const [{ data, error }, provinces] = await Promise.all([
    supabase.from('shipping_methods').select(METHOD_FIELDS).eq('id', id).maybeSingle(),
    listProvinces()
  ])
  if (error) throw error
  return data ? toMethod(data, provinces.length) : null
}

async function nameIsTaken(uid, name, exceptId) {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('id, name')
    .eq('seller_user_id', uid)
  if (error) throw error
  const normalized = name.trim().toLowerCase()
  return (data || []).some(m => m.id !== exceptId && m.name.trim().toLowerCase() === normalized)
}

/**
 * Crea o actualiza un método con su precio, demora y provincias.
 * Devuelve el id del método.
 */
export async function saveShippingMethod({ id = null, name, active = true, price, eta_days, province_ids }) {
  const uid = await currentUserId()
  if (await nameIsTaken(uid, name, id)) {
    throw new Error('Ya tenés un método de envío con ese nombre.')
  }

  let methodId = id
  if (id) {
    const { data, error } = await supabase
      .from('shipping_methods')
      .update({ name: name.trim(), active })
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (!data?.length) throw new Error('No tenés permiso para modificar este método.')
  } else {
    const { data, error } = await supabase
      .from('shipping_methods')
      .insert({ seller_user_id: uid, name: name.trim(), active })
      .select('id')
      .single()
    if (error) throw error
    methodId = data.id
  }

  // Replace coverage: rates first (their zone_id would only be set to null), then zones
  const { error: delRatesError } = await supabase.from('shipping_rates').delete().eq('method_id', methodId)
  if (delRatesError) throw delRatesError
  const { error: delZonesError } = await supabase.from('shipping_zones').delete().eq('method_id', methodId)
  if (delZonesError) throw delZonesError

  const provinces = await listProvinces()
  const namesById = Object.fromEntries(provinces.map(p => [p.id, p.name]))
  const { data: zones, error: zonesError } = await supabase
    .from('shipping_zones')
    .insert(province_ids.map(pid => ({ method_id: methodId, province_id: pid, zone_name: namesById[pid] || 'Provincia', ...WHOLE_PROVINCE })))
    .select('id')
  if (zonesError) throw zonesError

  const { error: ratesError } = await supabase
    .from('shipping_rates')
    .insert(zones.map(z => ({ method_id: methodId, zone_id: z.id, price: Number(price), eta_days: Number(eta_days), active: true })))
  if (ratesError) throw ratesError

  return methodId
}

export async function setShippingMethodActive(id, active) {
  const { data, error } = await supabase
    .from('shipping_methods')
    .update({ active })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para modificar este método.')
}

// Zones, rates and the links with products are removed by ON DELETE CASCADE
export async function deleteShippingMethod(id) {
  const { data, error } = await supabase
    .from('shipping_methods')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para eliminar este método.')
}

export function formatShippingPrice(price) {
  if (price === null || price === undefined) return 'Sin precio'
  if (Number(price) === 0) return 'Gratis'
  return formatMoney(price)
}

export function shippingSummary(method) {
  if (!method.configured) return 'Falta completar precio y cobertura'
  const days = method.eta_days === 1 ? '1 día' : `${method.eta_days} días`
  const coverage = method.all_country ? 'Todo el país' : `${method.province_ids.length} ${method.province_ids.length === 1 ? 'provincia' : 'provincias'}`
  return `${formatShippingPrice(method.price)} · ${days} · ${coverage}`
}
