/**
 * Servicio de Órdenes
 *
 * Maneja operaciones relacionadas con órdenes de compra,
 * incluyendo creación, consulta y actualización de estados.
 */

import { supabase } from './supabase';

/**
 * Obtiene todas las órdenes del usuario actual con paginación.
 *
 * @param {Object} options - Opciones de consulta
 * @param {string} options.userId - ID del usuario
 * @param {number} [options.page=1] - Número de página
 * @param {number} [options.limit=10] - Órdenes por página
 * @param {string} [options.status] - Filtrar por estado
 * @returns {Promise<Object>} Objeto con órdenes y metadatos de paginación
 * @throws {Error} Si hay error en la consulta
 *
 * @example
 * const result = await getUserOrders({
 *   userId: 'user-123',
 *   page: 1,
 *   status: 'pending'
 * });
 */
export async function getUserOrders(options = {}) {
  const {
    userId,
    page = 1,
    limit = 10,
    status = null
  } = options;

  if (!userId) {
    throw new Error('userId es requerido');
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        product:product_id (
          id,
          name,
          image_url
        )
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[orders.js getUserOrders] Error:', error);
    throw new Error(`Error al obtener órdenes: ${error.message}`);
  }

  return {
    data,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  };
}

/**
 * Obtiene una orden por su ID con todos sus detalles.
 *
 * @param {string} orderId - ID de la orden
 * @returns {Promise<Object>} Orden con items y productos relacionados
 * @throws {Error} Si la orden no existe o hay error
 *
 * @example
 * const order = await getOrderById('order-123');
 * console.log(order.total, order.order_items);
 */
export async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:user_id (
        id,
        username,
        email
      ),
      order_items (
        id,
        quantity,
        unit_price,
        product:product_id (
          id,
          name,
          description,
          image_url,
          seller:seller_id (
            id,
            username
          )
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('[orders.js getOrderById] Error:', orderId, error);
    throw new Error(`Error al obtener orden: ${error.message}`);
  }

  return data;
}

/**
 * Crea una nueva orden con sus items.
 *
 * @param {Object} orderData - Datos de la orden
 * @param {string} orderData.userId - ID del usuario
 * @param {Array} orderData.items - Items de la orden
 * @param {number} orderData.total - Total de la orden
 * @param {Object} [orderData.shippingAddress] - Dirección de envío
 * @returns {Promise<Object>} Orden creada
 * @throws {Error} Si faltan datos o hay error al crear
 *
 * @example
 * const order = await createOrder({
 *   userId: 'user-123',
 *   items: [
 *     { productId: 'prod-1', quantity: 2, unitPrice: 1000 },
 *     { productId: 'prod-2', quantity: 1, unitPrice: 500 }
 *   ],
 *   total: 2500,
 *   shippingAddress: {
 *     street: 'Av. Corrientes 1234',
 *     city: 'CABA'
 *   }
 * });
 */
export async function createOrder(orderData) {
  const { userId, items, total, shippingAddress } = orderData;

  // Validaciones
  if (!userId) {
    throw new Error('userId es requerido');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Debe incluir al menos un item en la orden');
  }

  if (!total || total <= 0) {
    throw new Error('El total debe ser mayor a 0');
  }

  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      user_id: userId,
      total: total,
      status: 'pending',
      shipping_address: shippingAddress || null,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (orderError) {
    console.error('[orders.js createOrder] Error al crear orden:', orderError);
    throw new Error(`Error al crear orden: ${orderError.message}`);
  }

  // Crear items de la orden
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('[orders.js createOrder] Error al crear items:', itemsError);
    // Revertir: eliminar la orden si fallan los items
    await supabase.from('orders').delete().eq('id', order.id);
    throw new Error(`Error al crear items de orden: ${itemsError.message}`);
  }

  // Retornar orden completa con items
  return await getOrderById(order.id);
}

/**
 * Actualiza el estado de una orden.
 *
 * @param {string} orderId - ID de la orden
 * @param {string} status - Nuevo estado ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
 * @returns {Promise<Object>} Orden actualizada
 * @throws {Error} Si hay error al actualizar
 *
 * @example
 * await updateOrderStatus('order-123', 'shipped');
 */
export async function updateOrderStatus(orderId, status) {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    throw new Error(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`);
  }

  const updates = {
    status: status,
    updated_at: new Date().toISOString()
  };

  // Si se marca como delivered, guardar fecha de entrega
  if (status === 'delivered') {
    updates.delivered_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[orders.js updateOrderStatus] Error:', error);
    throw new Error(`Error al actualizar estado de orden: ${error.message}`);
  }

  return data;
}

/**
 * Cancela una orden.
 *
 * @param {string} orderId - ID de la orden
 * @param {string} [reason] - Razón de la cancelación
 * @returns {Promise<Object>} Orden cancelada
 * @throws {Error} Si la orden no puede cancelarse
 *
 * @example
 * await cancelOrder('order-123', 'Cliente solicitó cancelación');
 */
export async function cancelOrder(orderId, reason = null) {
  // Verificar estado actual
  const order = await getOrderById(orderId);

  if (order.status === 'delivered') {
    throw new Error('No se puede cancelar una orden ya entregada');
  }

  if (order.status === 'cancelled') {
    throw new Error('La orden ya está cancelada');
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[orders.js cancelOrder] Error:', error);
    throw new Error(`Error al cancelar orden: ${error.message}`);
  }

  return data;
}

/**
 * Obtiene estadísticas de órdenes de un usuario.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas (total de órdenes, total gastado, etc.)
 * @throws {Error} Si hay error al calcular estadísticas
 *
 * @example
 * const stats = await getUserOrderStats('user-123');
 * console.log(stats.totalOrders, stats.totalSpent);
 */
export async function getUserOrderStats(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('total, status')
    .eq('user_id', userId);

  if (error) {
    console.error('[orders.js getUserOrderStats] Error:', error);
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const stats = {
    totalOrders: data.length,
    totalSpent: data.reduce((sum, order) => sum + order.total, 0),
    pendingOrders: data.filter(o => o.status === 'pending').length,
    completedOrders: data.filter(o => o.status === 'delivered').length,
    cancelledOrders: data.filter(o => o.status === 'cancelled').length
  };

  return stats;
}
