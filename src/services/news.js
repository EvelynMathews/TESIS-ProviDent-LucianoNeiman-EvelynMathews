import { supabase } from './supabase'
import { getCached, setCached } from './cache'

export async function listPublishedNews() {
  const cacheKey = 'news:published'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('news')
    .select('id, title, slug, preview, published_at, news_images(path, alt_text, is_primary, position)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) throw error
  const results = data || []
  setCached(cacheKey, results)
  return results
}

export async function getNewsBySlug(slug) {
  const cacheKey = `news:slug:${slug}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('news')
    .select('id, title, slug, preview, content, published_at, news_images(path, alt_text, is_primary, position)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) throw error
  setCached(cacheKey, data)
  return data
}

export async function getNewsImageUrl(path) {
  if (!path) return null

  const { data } = await supabase.storage
    .from('news-images')
    .createSignedUrl(path, 3600)

  return data?.signedUrl || null
}
