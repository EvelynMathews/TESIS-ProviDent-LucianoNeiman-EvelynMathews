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

