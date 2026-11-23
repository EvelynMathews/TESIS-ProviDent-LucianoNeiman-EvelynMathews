// create-checkout: convierte el carrito del usuario en un pedido y crea la preferencia de Mercado Pago.
//
// Flujo:
//  1. Identifica al comprador por su JWT.
//  2. Relee el carrito desde la base (no confía en precios enviados por el navegador).
//  3. Valida: productos activos, stock de insumos, que no compre lo propio, domicilio propio
//     y que cada vendedor tenga cuenta de cobro.
//  4. Crea orders + order_items (+ detalle de alquiler / yeso), payments (PENDING) y payment_splits (5% comisión).
//  5. Crea la preferencia de Checkout Pro y devuelve la URL de pago.
import { corsHeaders, json, fail } from '../_shared/cors.ts'
import { adminClient, userFromRequest, round2, APP_FEE_RATE } from '../_shared/orders.ts'
import { createPreference, checkoutUrl, type PreferenceItem } from '../_shared/mercadopago.ts'

const TYPE_LABELS: Record<string, string> = {
  SUPPLY: 'Insumo',
  PROSTHESIS: 'Prótesis',
  PLASTER_SERVICE: 'Modelado en yeso',
  RENTAL: 'Alquiler',
}

function isPublicUrl(url: string) {
  try {
    const host = new URL(url).hostname
    return !['localhost', '127.0.0.1', '0.0.0.0'].includes(host) && !host.endsWith('.local')
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Método no permitido', 405)

  const admin = adminClient()
  const user = await userFromRequest(admin, req)
  if (!user) return fail('UNAUTHORIZED', 'Tu sesión expiró. Volvé a iniciar sesión.', 401)

  let body: { shipping_address_id?: string } = {}
  try { body = await req.json() } catch { /* cuerpo vacío */ }
  const addressId = body.shipping_address_id
  if (!addressId) return fail('ADDRESS_REQUIRED', 'Elegí un domicilio de entrega.')

  try {
    // --- Domicilio ---
    const { data: address } = await admin
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!address) return fail('ADDRESS_INVALID', 'El domicilio elegido no es válido. Elegí otro o cargá uno nuevo.')

    // --- Carrito (releído desde la base) ---
    const { data: cart } = await admin.from('carts').select('id').eq('buyer_user_id', user.id).maybeSingle()
    if (!cart) return fail('EMPTY_CART', 'Tu carrito está vacío.')

    const { data: rows, error: cartError } = await admin
      .from('cart_items')
      .select(`
        id, product_id, quantity, unit_price_snapshot, options_json,
        products ( id, name, product_type, owner_user_id, is_active, supply_products ( unit_price, stock_qty ) ),
        rental_cart_items ( start_date, end_date, start_time, end_time, total_days, calculated_price ),
        plaster_service_cart_items ( custom_description )
      `)
      .eq('cart_id', cart.id)
    if (cartError) throw cartError
    if (!rows || rows.length === 0) return fail('EMPTY_CART', 'Tu carrito está vacío.')

    const problems: { product_id: string; name: string; reason: string }[] = []
    const lines = rows.map((row: any) => {
      const p = row.products
      const name = p?.name || 'Producto'
      if (!p || p.is_active === false) {
        problems.push({ product_id: row.product_id, name, reason: 'Ya no está disponible' })
        return null
      }
      if (p.owner_user_id === user.id) {
        problems.push({ product_id: p.id, name, reason: 'Es una publicación tuya' })
        return null
      }

      let unitPrice = Number(row.unit_price_snapshot)
      const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1))
      if (p.product_type === 'SUPPLY') {
        const supply = Array.isArray(p.supply_products) ? p.supply_products[0] : p.supply_products
        unitPrice = Number(supply?.unit_price ?? unitPrice) // precio vigente del insumo
        if (supply?.stock_qty != null && quantity > Number(supply.stock_qty)) {
          problems.push({
            product_id: p.id, name,
            reason: Number(supply.stock_qty) > 0 ? `Solo quedan ${supply.stock_qty} unidades` : 'Sin stock',
          })
          return null
        }
      }
      if (!(unitPrice > 0)) {
        problems.push({ product_id: p.id, name, reason: 'No tiene un precio válido' })
        return null
      }

      return {
        order_item_id: crypto.randomUUID(),
        product_id: p.id,
        name,
        product_type: p.product_type,
        seller_id: p.owner_user_id,
        quantity,
        unit_price: round2(unitPrice),
        subtotal: round2(unitPrice * quantity),
        options_json: row.options_json,
        rental: row.rental_cart_items,
        plaster: row.plaster_service_cart_items,
      }
    }).filter(Boolean) as any[]

    if (problems.length) {
      return fail('CART_PROBLEMS', 'Hay productos de tu carrito que no se pueden comprar ahora.', 409, { problems })
    }

    // --- Cuenta de cobro de cada vendedor (necesaria para registrar su parte) ---
    const sellerIds = [...new Set(lines.map(l => l.seller_id))]
    const { data: accounts } = await admin
      .from('payment_accounts')
      .select('id, user_id, is_primary')
      .in('user_id', sellerIds)
      .eq('provider', 'MERCADOPAGO')
    const accountBySeller: Record<string, string> = {}
    for (const acc of accounts || []) {
      if (!accountBySeller[acc.user_id] || acc.is_primary) accountBySeller[acc.user_id] = acc.id
    }
    const notReady = lines.filter(l => !accountBySeller[l.seller_id])
    if (notReady.length) {
      return fail('SELLER_NOT_READY', 'Algunos vendedores todavía no pueden cobrar.', 409, {
        problems: notReady.map(l => ({ product_id: l.product_id, name: l.name, reason: 'El vendedor todavía no configuró su cuenta de cobro' })),
      })
    }

    const total = round2(lines.reduce((sum, l) => sum + l.subtotal, 0))

    // Pedidos anteriores que quedaron sin pagar se cancelan para no acumular pedidos fantasma.
    const { data: stale } = await admin
      .from('orders')
      .select('id, payments(status, provider_pay_id)')
      .eq('buyer_user_id', user.id)
      .eq('status', 'CREATED')
    const staleIds = (stale || [])
      .filter((o: any) => !(o.payments || []).some((p: any) => p.provider_pay_id && p.status !== 'REJECTED'))
      .map((o: any) => o.id)
    if (staleIds.length) {
      await admin.from('orders').update({ status: 'CANCELED', updated_at: new Date().toISOString() }).in('id', staleIds)
    }

    // --- Pedido ---
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        buyer_user_id: user.id,
        shipping_address_id: address.id,
        billing_address_id: address.id,
        status: 'CREATED',
        total_amount: total,
      })
      .select('id')
      .single()
    if (orderError) throw orderError

    const { error: itemsError } = await admin
      .from('order_items')
      .insert(lines.map(l => ({
        id: l.order_item_id,
        order_id: order.id,
        product_id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        subtotal: l.subtotal,
        snapshot_json: { name: l.name, product_type: l.product_type, seller_id: l.seller_id, options: l.options_json || null },
      })))
    if (itemsError) throw itemsError

    const rentalRows = lines.filter(l => l.product_type === 'RENTAL' && l.rental).map(l => ({
      order_item_id: l.order_item_id,
      start_date: l.rental.start_date,
      end_date: l.rental.end_date,
      start_time: l.rental.start_time,
      end_time: l.rental.end_time,
      total_days: l.rental.total_days,
      calculated_price: l.rental.calculated_price ?? l.subtotal,
    }))
    if (rentalRows.length) await admin.from('rental_order_items').insert(rentalRows)

    const plasterRows = lines.filter(l => l.product_type === 'PLASTER_SERVICE' && l.plaster?.custom_description).map(l => ({
      order_item_id: l.order_item_id,
      custom_description: l.plaster.custom_description,
    }))
    if (plasterRows.length) await admin.from('plaster_service_order_items').insert(plasterRows)

    // --- Pago pendiente + reparto por vendedor ---
    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .insert({ order_id: order.id, provider: 'MERCADOPAGO', status: 'PENDING', amount: total, payer_user_id: user.id })
      .select('id')
      .single()
    if (paymentError) throw paymentError

    const { error: splitsError } = await admin.from('payment_splits').insert(lines.map(l => {
      const fee = round2(l.subtotal * APP_FEE_RATE)
      return {
        payment_id: payment.id,
        order_item_id: l.order_item_id,
        seller_account_id: accountBySeller[l.seller_id],
        gross_amount: l.subtotal,
        app_fee_amount: fee,
        net_amount: round2(l.subtotal - fee),
        escrow_status: 'HELD',
      }
    }))
    if (splitsError) throw splitsError

    // --- Preferencia de Mercado Pago ---
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/+$/, '')
    const items: PreferenceItem[] = lines.map(l => ({
      id: l.product_id,
      title: l.name.slice(0, 250),
      description: TYPE_LABELS[l.product_type] || 'Producto',
      quantity: l.quantity,
      unit_price: l.unit_price,
      currency_id: 'ARS',
    }))

    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const preferenceBody: Record<string, unknown> = {
      items,
      payer: { email: user.email },
      external_reference: order.id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      statement_descriptor: 'PROVIDENT',
      metadata: { order_id: order.id },
      expires: true,
      expiration_date_to: expiration,
    }
    // Mercado Pago no acepta dominios locales en back_urls: en ese caso el comprador vuelve a mano.
    if (siteUrl && isPublicUrl(siteUrl)) {
      const back = `${siteUrl}/pago/resultado?orden=${order.id}`
      preferenceBody.back_urls = { success: back, pending: back, failure: back }
      preferenceBody.auto_return = 'approved'
    }

    let preference
    try {
      preference = await createPreference(preferenceBody, order.id)
    } catch (mpError) {
      console.error('Error creando preferencia', mpError)
      await admin.from('orders').update({ status: 'CANCELED' }).eq('id', order.id)
      await admin.from('payments').update({ status: 'REJECTED', raw_payload: { error: String(mpError) } }).eq('id', payment.id)
      return fail('MP_ERROR', 'Mercado Pago no respondió. Intentá de nuevo en unos minutos.', 502)
    }

    await admin.from('payments').update({ provider_pref_id: preference.id, updated_at: new Date().toISOString() }).eq('id', payment.id)

    return json({
      order_id: order.id,
      checkout_url: checkoutUrl(preference),
      has_return_url: Boolean(preferenceBody.back_urls),
    })
  } catch (error) {
    console.error('create-checkout error', error)
    return fail('INTERNAL', 'No pudimos preparar tu pago. Intentá de nuevo.', 500)
  }
})
