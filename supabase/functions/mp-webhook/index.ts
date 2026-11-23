// mp-webhook: recibe los avisos de Mercado Pago cuando un pago cambia de estado.
// Se despliega SIN verificación de JWT (Mercado Pago no manda el token de Supabase).
// Seguridad: valida la firma si MP_WEBHOOK_SECRET está configurado y, sobre todo, nunca confía
// en el cuerpo del aviso: vuelve a consultar el pago a la API de Mercado Pago con nuestra clave.
import { json } from '../_shared/cors.ts'
import { adminClient, applyMercadoPagoPayment } from '../_shared/orders.ts'
import { getPayment, isValidSignature } from '../_shared/mercadopago.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: true })

  const url = new URL(req.url)
  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* algunos avisos llegan solo con query params */ }

  const type = body.type || url.searchParams.get('type') || url.searchParams.get('topic')
  const dataId = String(body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '')

  // Solo nos interesan los avisos de pagos; el resto se confirma para que no se reintente.
  if (type !== 'payment' || !dataId) return json({ ok: true, ignored: true })

  // Mercado Pago manda dos formatos: Webhooks (?type=&data.id=, firmados con x-signature) e IPN
  // (?topic=&id=, sin firma). Se exige firma a los Webhooks; los IPN se aceptan porque el pago
  // igual se vuelve a consultar a la API con nuestra clave (un aviso falso no puede aprobar nada).
  const isIpn = !body.type && url.searchParams.has('topic')
  if (!isIpn && !(await isValidSignature(req, url.searchParams.get('data.id') || dataId))) {
    console.warn('Firma de webhook inválida', dataId)
    return json({ ok: false, error: 'invalid signature' }, 401)
  }

  try {
    const mpPayment = await getPayment(dataId)
    const result = await applyMercadoPagoPayment(adminClient(), mpPayment)
    return json({ ok: true, ...result })
  } catch (error) {
    const status = (error as { status?: number }).status
    // Pago inexistente (aviso de prueba o de otra cuenta): se confirma para que no se reintente.
    if (status === 404) return json({ ok: true, ignored: true, reason: 'payment not found' })
    // Cualquier otro error (por ejemplo, token inválido) responde 500 para que Mercado Pago reintente.
    console.error('mp-webhook error', error)
    return json({ ok: false, reason: status === 401 ? 'invalid MP_ACCESS_TOKEN' : 'error' }, 500)
  }
})
