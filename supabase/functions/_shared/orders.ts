// Lógica compartida de pedidos y pagos.
// Usa la service role key (solo disponible dentro de las Edge Functions) para escribir
// pedidos, pagos y repartos; las políticas RLS siguen protegiendo el acceso desde el navegador.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

/** Comisión de ProviDent sobre cada venta (5%). */
export const APP_FEE_RATE = 0.05

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Usuario dueño del JWT que manda el navegador (o null si no hay sesión válida). */
export async function userFromRequest(admin: SupabaseClient, req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error) return null
  return data.user
}

export const round2 = (n: number) => Math.round(n * 100) / 100

/** Estado de Mercado Pago -> enum payment_status de la base. */
export function mapPaymentStatus(mpStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CHARGED_BACK' {
  switch (mpStatus) {
    case 'approved': return 'APPROVED'
    case 'rejected':
    case 'cancelled': return 'REJECTED'
    case 'refunded': return 'REFUNDED'
    case 'charged_back': return 'CHARGED_BACK'
    default: return 'PENDING' // pending, in_process, authorized, in_mediation
  }
}

/**
 * Aplica un pago de Mercado Pago (ya consultado a la API, fuente confiable) sobre el pedido.
 * Es idempotente: Mercado Pago puede avisar varias veces el mismo pago.
 * - approved: pago APPROVED, pedido PAID, descuenta stock de insumos y vacía esos ítems del carrito.
 * - rejected/cancelled: pago REJECTED; el pedido queda CREATED (el comprador puede reintentar).
 * - refunded/charged_back: pedido CANCELED y repartos REFUNDED.
 */
export async function applyMercadoPagoPayment(admin: SupabaseClient, mpPayment: Record<string, any>) {
  const orderId = mpPayment.external_reference
  if (!orderId) return { applied: false, reason: 'sin external_reference' }

  const { data: order } = await admin
    .from('orders')
    .select('id, status, total_amount, buyer_user_id')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return { applied: false, reason: 'pedido inexistente' }

  const { data: payment } = await admin
    .from('payments')
    .select('id, status')
    .eq('order_id', orderId)
    .eq('provider', 'MERCADOPAGO')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!payment) return { applied: false, reason: 'pago inexistente' }

  let newStatus = mapPaymentStatus(mpPayment.status)

  // Defensa extra: un pago aprobado por menos del total no marca el pedido como pagado.
  if (newStatus === 'APPROVED' && Number(mpPayment.transaction_amount) + 0.01 < Number(order.total_amount)) {
    console.error('Monto pagado menor al total del pedido', orderId, mpPayment.transaction_amount, order.total_amount)
    newStatus = 'PENDING'
  }

  const alreadyApproved = payment.status === 'APPROVED'
  if (alreadyApproved && newStatus === 'APPROVED') {
    return { applied: true, order_status: order.status, payment_status: 'APPROVED' }
  }

  await admin.from('payments').update({
    status: newStatus,
    provider_pay_id: String(mpPayment.id),
    received_at: newStatus === 'APPROVED' ? (mpPayment.date_approved || new Date().toISOString()) : null,
    raw_payload: mpPayment,
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id)

  let orderStatus = order.status
  if (newStatus === 'APPROVED' && order.status === 'CREATED') {
    orderStatus = 'PAID'
    // El webhook y verify-payment pueden llegar al mismo tiempo: el UPDATE condicional
    // (status = 'CREATED') solo lo gana uno, y solo ese descuenta stock y vacía el carrito.
    const { data: won } = await admin
      .from('orders')
      .update({ status: 'PAID', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'CREATED')
      .select('id')
    if (won && won.length > 0) {
      await fulfillApprovedOrder(admin, orderId, order.buyer_user_id)
    }
  } else if ((newStatus === 'REFUNDED' || newStatus === 'CHARGED_BACK') && order.status !== 'CANCELED') {
    orderStatus = 'CANCELED'
    await admin.from('orders').update({ status: 'CANCELED', updated_at: new Date().toISOString() }).eq('id', orderId)
    await admin.from('payment_splits').update({ escrow_status: 'REFUNDED', updated_at: new Date().toISOString() }).eq('payment_id', payment.id)
  }

  return { applied: true, order_status: orderStatus, payment_status: newStatus }
}

/** Descuenta stock de los insumos y quita del carrito lo que se compró. */
async function fulfillApprovedOrder(admin: SupabaseClient, orderId: string, buyerId: string) {
  const { data: items } = await admin
    .from('order_items')
    .select('product_id, quantity, products(product_type)')
    .eq('order_id', orderId)

  for (const item of items || []) {
    if ((item as any).products?.product_type !== 'SUPPLY') continue
    const { data: supply } = await admin.from('supply_products').select('stock_qty').eq('product_id', item.product_id).maybeSingle()
    if (supply && supply.stock_qty != null) {
      await admin.from('supply_products')
        .update({ stock_qty: Math.max(0, Number(supply.stock_qty) - Number(item.quantity)) })
        .eq('product_id', item.product_id)
    }
  }

  const { data: cart } = await admin.from('carts').select('id').eq('buyer_user_id', buyerId).maybeSingle()
  const productIds = (items || []).map(i => i.product_id)
  if (cart && productIds.length) {
    await admin.from('cart_items').delete().eq('cart_id', cart.id).in('product_id', productIds)
  }
}
