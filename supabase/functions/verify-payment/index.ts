// verify-payment: cuando el comprador vuelve de Mercado Pago, consulta el estado real del pago
// y actualiza el pedido sin esperar al webhook (que puede tardar unos segundos).
// Si el comprador volvió sin payment_id (por ejemplo, probando en localhost), busca el último
// pago del pedido por external_reference.
import { corsHeaders, json, fail } from '../_shared/cors.ts'
import { adminClient, userFromRequest, applyMercadoPagoPayment } from '../_shared/orders.ts'
import { getPayment, findLatestPaymentByReference } from '../_shared/mercadopago.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Método no permitido', 405)

  const admin = adminClient()
  const user = await userFromRequest(admin, req)
  if (!user) return fail('UNAUTHORIZED', 'Tu sesión expiró. Volvé a iniciar sesión.', 401)

  let body: { order_id?: string; payment_id?: string } = {}
  try { body = await req.json() } catch { /* cuerpo vacío */ }
  if (!body.order_id) return fail('ORDER_REQUIRED', 'Falta el número de pedido.')

  const { data: order } = await admin
    .from('orders')
    .select('id, status, total_amount, created_at, buyer_user_id')
    .eq('id', body.order_id)
    .maybeSingle()
  if (!order || order.buyer_user_id !== user.id) return fail('ORDER_NOT_FOUND', 'No encontramos ese pedido.', 404)

  let mpPayment: Record<string, any> | null = null
  try {
    if (body.payment_id && /^\d+$/.test(String(body.payment_id))) {
      mpPayment = await getPayment(body.payment_id)
      if (mpPayment?.external_reference !== order.id) mpPayment = null // payment_id de otro pedido
    }
    if (!mpPayment) mpPayment = await findLatestPaymentByReference(order.id)
  } catch (error) {
    console.error('verify-payment: error consultando a Mercado Pago', error)
  }

  let orderStatus = order.status
  let paymentStatus = 'PENDING'
  if (mpPayment) {
    const result = await applyMercadoPagoPayment(admin, mpPayment)
    if (result.applied) {
      orderStatus = result.order_status ?? orderStatus
      paymentStatus = result.payment_status ?? paymentStatus
    }
  } else {
    const { data: payment } = await admin
      .from('payments')
      .select('status')
      .eq('order_id', order.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    paymentStatus = payment?.status || 'PENDING'
  }

  return json({
    order_id: order.id,
    order_status: orderStatus,
    payment_status: paymentStatus,
    // true cuando el comprador todavía no completó el pago en Mercado Pago
    awaiting_payment: !mpPayment,
    status_detail: mpPayment?.status_detail || null,
    payment_method: mpPayment?.payment_method_id || null,
    total: Number(order.total_amount),
    created_at: order.created_at,
  })
})
