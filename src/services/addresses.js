/**
 * Servicio de domicilios personales del usuario (tabla `addresses`).
 * Se usa en "Mi perfil" para ver y guardar la dirección principal.
 */
import { supabase } from './supabase'

export async function getPrimaryAddress(userId) {
  const { data, error } = await supabase
    .from('addresses')
    .select('id, street, city, postal_code, province_id, is_primary, provinces(name)')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, province: data.provinces?.name || '' }
}

export async function savePrimaryAddress(userId, address) {
  const fields = {
    street: address.street?.trim() || null,
    city: address.city.trim(),
    postal_code: address.postal_code?.trim() || null,
    province_id: address.province_id,
    is_primary: true,
    updated_at: new Date().toISOString()
  }

  const query = address.id
    ? supabase.from('addresses').update(fields).eq('id', address.id)
    : supabase.from('addresses').insert({ ...fields, user_id: userId })

  const { data, error } = await query.select('id').single()
  if (error) throw error
  return data
}
