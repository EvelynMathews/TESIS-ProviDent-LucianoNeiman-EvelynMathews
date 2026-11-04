import { supabase } from './supabase'

const USER_FIELDS = `
  id, first_name, last_name, email, is_active, created_at,
  user_profiles(bio, location, avatar),
  user_roles(role)
`

export async function isAdmin(userId) {
  const { data, error } = await supabase.rpc('is_admin', { _uid: userId })
  if (error) throw error
  return data === true
}

function toAdminUser(row) {
  const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    is_active: row.is_active,
    created_at: row.created_at,
    bio: profile?.bio || '',
    location: profile?.location || '',
    roles: (row.user_roles || []).map(r => r.role)
  }
}

// RLS only returns every user to admins
export async function listUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toAdminUser)
}

export async function getUserForAdmin(id) {
  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? toAdminUser(data) : null
}

export async function setUserActive(id, isActive) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para modificar este usuario')
}

export async function updateUserByAdmin(id, { first_name, last_name, bio, location, is_active }) {
  const { data, error } = await supabase
    .from('users')
    .update({ first_name, last_name, is_active })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para modificar este usuario')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .update({ bio: bio || null, location: location || null, updated_at: new Date().toISOString() })
    .eq('user_id', id)
    .select('user_id')
  if (profileError) throw profileError
  if (!profile?.length) throw new Error('No se pudo guardar el perfil del usuario')
}
