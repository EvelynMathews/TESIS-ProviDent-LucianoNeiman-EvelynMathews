/**
 * Servicio de gestión de roles y cuentas de pago para vendedores.
 * Propósito: Proporcionar funciones para verificar si el usuario actual
 * tiene el rol de vendedor y para facilitar la activación de dicho rol
 * y la conexión de una cuenta de pago inicial (mock/dummy).
 * Funcionamiento: `isCurrentUserSeller` consulta la tabla `user_roles`.
 * `grantSellerSelf` invoca una función RPC de la base de datos para
 * autootorgar el rol de vendedor. `connectDummyPaymentAccount` simula
 * la conexión con un proveedor de pagos al crear un registro en `payment_accounts`.
 */

import { supabase } from './supabase'

export async function isCurrentUserSeller() {
  const { data: me, error: uerr } = await supabase.auth.getUser()
  if (uerr || !me?.user?.id) return false
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', me.user.id)
    .eq('role', 'SELLER')
    .limit(1)
  if (error) return false
  return Array.isArray(data) && data.length === 1
}

export async function grantSellerSelf() {
  const { error } = await supabase.rpc('grant_seller_self')
  if (error) throw error
  return true
}

export async function hasPaymentAccount() {
  const { data: me } = await supabase.auth.getUser()
  const uid = me?.user?.id
  if (!uid) return false
  const { data, error } = await supabase
    .from('payment_accounts')
    .select('id')
    .eq('user_id', uid)
    .limit(1)
  if (error) return false
  return Array.isArray(data) && data.length === 1
}

export async function connectDummyPaymentAccount(provider = 'MERCADOPAGO') {
  const { data: me } = await supabase.auth.getUser()
  const uid = me?.user?.id
  if (!uid) throw new Error('No auth user')
  const { error } = await supabase
    .from('payment_accounts')
    .insert({ user_id: uid, provider, config_json: {}, is_primary: true })
  if (error) throw error
  return true
}
