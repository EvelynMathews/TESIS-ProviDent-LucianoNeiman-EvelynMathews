/**
 * Servicio de pago con Mercado Pago (Checkout Pro).
 * Propósito: Conectar las pantallas de pago con las Edge Functions de Supabase, que son las únicas
 * que conocen la clave secreta de Mercado Pago.
 * Funcionamiento:
 *  - `startCheckout` llama a `create-checkout`: valida el carrito en el servidor, crea el pedido y
 *    devuelve la URL de pago de Mercado Pago.
 *  - `verifyPayment` llama a `verify-payment`: consulta el estado real del pago al volver.
 *  - El último pedido en curso se recuerda en el navegador para poder retomarlo si el comprador
 *    vuelve a ProviDent sin pasar por la URL de retorno.
 */
import { supabase } from './supabase'

const PENDING_ORDER_KEY = 'provident:pending-order'

/** Mensajes claros para cada código de error que devuelven las funciones. */
const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Tu sesión expiró. Volvé a iniciar sesión para pagar.',
    ADDRESS_REQUIRED: 'Elegí un domicilio de entrega.',
    ADDRESS_INVALID: 'El domicilio elegido no es válido. Elegí otro o cargá uno nuevo.',
    EMPTY_CART: 'Tu carrito está vacío.',
    CART_PROBLEMS: 'Hay productos de tu carrito que no se pueden comprar ahora.',
    SELLER_NOT_READY: 'Algunos vendedores todavía no pueden cobrar.',
    MP_ERROR: 'Mercado Pago no respondió. Intentá de nuevo en unos minutos.',
    ORDER_NOT_FOUND: 'No encontramos ese pedido.',
}

export class CheckoutError extends Error {
    constructor(code, message, problems = []) {
        super(message)
        this.code = code
        this.problems = problems
    }
}

async function invoke(name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body })
    if (!error) return data

    // FunctionsHttpError trae la respuesta de la función con nuestro { error: { code, message } }
    let payload = null
    try { payload = await error.context?.json() } catch { /* sin cuerpo */ }
    const code = payload?.error?.code || 'NETWORK'
    const message = payload?.error?.message || ERROR_MESSAGES[code] ||
        'No pudimos conectarnos con el servicio de pagos. Revisá tu conexión e intentá de nuevo.'
    throw new CheckoutError(code, message, payload?.error?.problems || [])
}

export async function startCheckout(shippingAddressId) {
    const data = await invoke('create-checkout', { shipping_address_id: shippingAddressId })
    if (!data?.checkout_url) throw new CheckoutError('MP_ERROR', ERROR_MESSAGES.MP_ERROR)
    rememberPendingOrder(data.order_id, data.checkout_url)
    return data
}

export function verifyPayment(orderId, paymentId = null) {
    return invoke('verify-payment', { order_id: orderId, payment_id: paymentId })
}

export function rememberPendingOrder(orderId, checkoutUrl = null) {
    try { localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ orderId, checkoutUrl, at: Date.now() })) } catch { /* modo privado */ }
}

/** Pedido en curso de las últimas 24 h (las preferencias vencen a las 24 h): { orderId, checkoutUrl }. */
export function getPendingOrder() {
    try {
        const saved = JSON.parse(localStorage.getItem(PENDING_ORDER_KEY))
        if (saved?.orderId && Date.now() - saved.at < 24 * 60 * 60 * 1000) return saved
    } catch { /* sin datos */ }
    return null
}

export function clearPendingOrder() {
    try { localStorage.removeItem(PENDING_ORDER_KEY) } catch { /* sin datos */ }
}
