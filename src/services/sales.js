/**
 * Servicio de ventas, compras y liquidaciones.
 * Propósito: Dar a cada rol lo que necesita después del pago:
 *  - Comprador: detalle de cada compra (`getMyOrder`) y listado completo (`listMyPurchases`).
 *  - Vendedor: sus ventas pagadas con datos del comprador (`getSellerSales`) y el avance del envío
 *    (`updateFulfillment`), que al marcar "Entregado" libera su parte para cobrar.
 *  - Admin: lo que se le debe a cada vendedor (`getSettlements`) y el registro de transferencias (`markPayouts`).
 * Funcionamiento: Usa funciones de Postgres (RPC, SECURITY DEFINER) que validan quién llama con auth.uid(),
 * así cada usuario solo ve y modifica lo suyo.
 */
import { supabase } from './supabase'

export const FULFILLMENT_LABELS = {
    PENDING: 'Pendiente de envío',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
}

export const ORDER_STATUS_LABELS = {
    CREATED: 'Pendiente de pago',
    PAID: 'Pagado',
    FULFILLING: 'En preparación',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    COMPLETED: 'Completado',
    CANCELED: 'Cancelado',
}

const RPC_ERRORS = {
    not_found: 'No encontramos esa venta.',
    order_not_paid: 'El pedido todavía no está pagado.',
    invalid_transition: 'Esa venta ya está en ese estado o más avanzada.',
    invalid_status: 'Estado no válido.',
    forbidden: 'No tenés permisos para esta acción.',
}

function friendlyError(error, fallback) {
    const key = Object.keys(RPC_ERRORS).find(k => error?.message?.includes(k))
    // Si la base todavía no tiene la migración, la función no existe
    if (error?.code === 'PGRST202' || error?.message?.includes('Could not find the function')) {
        return new Error('Falta aplicar la actualización de la base de datos (ventas y liquidaciones).')
    }
    return new Error(key ? RPC_ERRORS[key] : fallback)
}

// --- Comprador ---

export async function getMyOrder(orderId) {
    const { data, error } = await supabase.rpc('get_my_order', { p_order_id: orderId })
    if (error) throw friendlyError(error, 'No pudimos cargar la compra.')
    return data // null si no existe o no es del usuario
}

/** Todas las compras del usuario (pagadas, en proceso o reembolsadas). Oculta checkouts abandonados. */
export async function listMyPurchases() {
    const { data: auth } = await supabase.auth.getSession()
    const uid = auth?.session?.user?.id
    if (!uid) throw new Error('Tu sesión expiró. Volvé a iniciar sesión.')
    const { data, error } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at, order_items(id, quantity, snapshot_json), payments(status)')
        .eq('buyer_user_id', uid)
        .order('created_at', { ascending: false })
    if (error) throw new Error('No pudimos cargar tus compras.')
    const wasPaid = o => (o.payments || []).some(p => ['APPROVED', 'REFUNDED', 'CHARGED_BACK'].includes(p.status))
    return (data || [])
        .filter(o => o.status !== 'CANCELED' || wasPaid(o))
        .map(o => ({
            ...o,
            items_count: (o.order_items || []).reduce((n, i) => n + (i.quantity || 0), 0),
            names: (o.order_items || []).map(i => i.snapshot_json?.name).filter(Boolean),
        }))
}

// --- Vendedor ---

export async function getSellerSales() {
    const { data, error } = await supabase.rpc('get_seller_sales')
    if (error) throw friendlyError(error, 'No pudimos cargar tus ventas.')
    return data || []
}

export async function updateFulfillment(orderItemId, status) {
    const { data, error } = await supabase.rpc('seller_update_fulfillment', { p_order_item_id: orderItemId, p_status: status })
    if (error) throw friendlyError(error, 'No pudimos actualizar el estado del envío.')
    return data
}

// --- Admin ---

export async function getSettlements() {
    const { data, error } = await supabase.rpc('admin_get_settlements')
    if (error) throw friendlyError(error, 'No pudimos cargar las liquidaciones.')
    return data || []
}

export async function markPayouts(splitIds, reference = '') {
    const { data, error } = await supabase.rpc('admin_mark_payouts', { p_split_ids: splitIds, p_reference: reference })
    if (error) throw friendlyError(error, 'No pudimos registrar la transferencia.')
    return data
}

export function shortOrderId(id) {
    return id ? `#${String(id).slice(0, 8).toUpperCase()}` : ''
}
