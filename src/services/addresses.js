/**
 * Servicio de domicilios y pedidos del usuario logueado.
 * Propósito: Reemplazar los datos de ejemplo del perfil por información real
 * guardada en Supabase (tablas `addresses`, `provinces`, `orders`, `order_items`).
 * Funcionamiento: Cada función obtiene el usuario actual y opera solo sobre
 * sus propios registros (las políticas RLS también lo garantizan del lado del servidor).
 */

import { supabase } from './supabase'

async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  const uid = data?.user?.id
  if (!uid) throw new Error('Tu sesión expiró. Volvé a iniciar sesión.')
  return uid
}

export async function listMyAddresses() {
  const uid = await currentUserId()
  const { data, error } = await supabase
    .from('addresses')
    .select('id, street, city, postal_code, province_id, recipient_name, is_primary, provinces(name)')
    .eq('user_id', uid)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(a => ({ ...a, province_name: a.provinces?.name || '' }))
}

/**
 * Crea o actualiza un domicilio. Si se marca como principal, desmarca los demás.
 */
export async function saveAddress(address) {
  const uid = await currentUserId()
  const payload = {
    street: (address.street || '').trim() || null,
    city: (address.city || '').trim(),
    postal_code: (address.postal_code || '').trim() || null,
    province_id: address.province_id,
    recipient_name: (address.recipient_name || '').trim() || null,
    is_primary: !!address.is_primary,
    updated_at: new Date().toISOString(),
  }

  if (payload.is_primary) {
    await supabase.from('addresses').update({ is_primary: false }).eq('user_id', uid)
  }

  if (address.id) {
    const { error } = await supabase.from('addresses').update(payload).eq('id', address.id).eq('user_id', uid)
    if (error) throw error
    return address.id
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...payload, user_id: uid })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function deleteAddress(id) {
  const uid = await currentUserId()
  const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', uid)
  if (error) throw error
}

export async function setPrimaryAddress(id) {
  const uid = await currentUserId()
  await supabase.from('addresses').update({ is_primary: false }).eq('user_id', uid)
  const { error } = await supabase.from('addresses').update({ is_primary: true }).eq('id', id).eq('user_id', uid)
  if (error) throw error
}

/**
 * Últimos pedidos del comprador. Si la consulta falla devuelve una lista vacía:
 * el perfil sigue funcionando aunque el historial no esté disponible.
 */
export async function listMyOrders(limit = 5) {
  try {
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, order_items(id)')
      .eq('buyer_user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data || []).map(o => ({ ...o, items_count: o.order_items?.length || 0 }))
  } catch {
    return []
  }
}
