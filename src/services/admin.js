import { supabase } from './supabase'

export async function isAdmin(userId) {
  const { data, error } = await supabase.rpc('is_admin', { _uid: userId })
  if (error) throw error
  return data === true
}
