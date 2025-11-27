/**
 * Sistema de caché simple en memoria
 * TTL por defecto: 5 minutos
 */

const cache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

export function getCached(key) {
  const item = cache.get(key)
  if (!item) return null

  if (Date.now() > item.expires) {
    cache.delete(key)
    return null
  }

  return item.data
}

export function setCached(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expires: Date.now() + ttl
  })
}

export function clearCache(key) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
