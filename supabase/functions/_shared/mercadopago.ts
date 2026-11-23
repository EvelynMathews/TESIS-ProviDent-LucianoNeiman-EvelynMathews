// Cliente mínimo de la API REST de Mercado Pago (sin SDK, para Deno / Edge Functions).
// La clave secreta (MP_ACCESS_TOKEN) vive solo como secreto de Supabase: nunca llega al navegador.

const MP_API = 'https://api.mercadopago.com'

export function getAccessToken(): string {
  const token = Deno.env.get('MP_ACCESS_TOKEN')
  if (!token) throw new Error('Falta el secreto MP_ACCESS_TOKEN en Supabase')
  return token
}

async function mpFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error(`Mercado Pago ${res.status}: ${data?.message || text}`) as Error & { status?: number; data?: unknown }
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export interface PreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id: 'ARS'
  description?: string
}

export function createPreference(body: Record<string, unknown>, idempotencyKey: string) {
  return mpFetch('/checkout/preferences', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

export function getPayment(paymentId: string | number) {
  return mpFetch(`/v1/payments/${encodeURIComponent(String(paymentId))}`)
}

/** Último pago asociado a un pedido (se usa cuando el comprador vuelve sin payment_id). */
export async function findLatestPaymentByReference(externalReference: string) {
  const qs = new URLSearchParams({ external_reference: externalReference, sort: 'date_created', criteria: 'desc', limit: '1' })
  const data = await mpFetch(`/v1/payments/search?${qs}`)
  return data?.results?.[0] || null
}

/** URL de pago: con credenciales "TEST-" Mercado Pago usa sandbox_init_point. */
export function checkoutUrl(preference: { init_point?: string; sandbox_init_point?: string }): string {
  const isTestToken = getAccessToken().startsWith('TEST-')
  return (isTestToken && preference.sandbox_init_point) || preference.init_point || preference.sandbox_init_point || ''
}

/**
 * Valida la firma del webhook (encabezado x-signature) con el secreto MP_WEBHOOK_SECRET.
 * Plantilla oficial: "id:{data.id};request-id:{x-request-id};ts:{ts};" firmada con HMAC SHA-256 (hex).
 * Si el secreto no está configurado se omite la validación: igualmente el pago se vuelve a consultar
 * a la API con nuestra clave, así que un aviso falso no puede aprobar nada.
 */
export async function isValidSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET')
  if (!secret) return true

  const signature = req.headers.get('x-signature') || ''
  const requestId = req.headers.get('x-request-id') || ''
  const parts = Object.fromEntries(signature.split(',').map(p => p.trim().split('=').map(s => s.trim())))
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId
  let manifest = ''
  if (id) manifest += `id:${id};`
  if (requestId) manifest += `request-id:${requestId};`
  manifest += `ts:${ts};`

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === v1
}
