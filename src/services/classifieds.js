import { supabase } from './supabase'
import { getCached, setCached, clearCache } from './cache'

const FIELDS = 'id, title, company, location, job_type, summary, description, requirements, contact_email, is_active, published_at'

const ACTIVE_CACHE_KEY = 'classifieds:active'

export const JOB_TYPES = ['Full-time', 'Part-time', 'Por turnos', 'Temporal', 'Freelance']

export async function listActiveClassifieds(limit = 6) {
  const cached = getCached(ACTIVE_CACHE_KEY)
  if (cached) return cached

  const { data, error } = await supabase
    .from('classifieds')
    .select(FIELDS)
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const results = data || []
  setCached(ACTIVE_CACHE_KEY, results)
  return results
}

// Admin: RLS returns every ad (active or not) only to admins
export async function listAllClassifieds() {
  const { data, error } = await supabase
    .from('classifieds')
    .select(FIELDS)
    .order('published_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getClassifiedById(id) {
  const { data, error } = await supabase
    .from('classifieds')
    .select(FIELDS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveClassified(id, fields) {
  const query = id
    ? supabase.from('classifieds').update(fields).eq('id', id)
    : supabase.from('classifieds').insert(fields)

  const { data, error } = await query.select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para guardar este anuncio')
  clearCache(ACTIVE_CACHE_KEY)
  return data[0]
}

export async function deleteClassified(id) {
  const { data, error } = await supabase
    .from('classifieds')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No tenés permiso para eliminar este anuncio')
  clearCache(ACTIVE_CACHE_KEY)
}
