/**
 * Servicio para validar disponibilidad de productos de alquiler
 * Propósito: Verificar que haya stock disponible para el período solicitado
 * considerando otros alquileres activos
 */

import { supabase } from './supabase'

/**
 * Verifica si hay stock disponible para alquilar un producto en un período determinado
 * @param {string} productId - ID del producto a alquilar
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<{available: boolean, stockQty: number, bookedQty: number}>}
 */
export async function checkRentalAvailability(productId, startDate, endDate) {
  try {
    const { data: rentalProduct, error: productError } = await supabase
      .from('rental_products')
      .select('stock_qty')
      .eq('product_id', productId)
      .single()

    if (productError) {
      console.error('Error fetching rental product:', productError)
      return { available: false, stockQty: 0, bookedQty: 0 }
    }

    const totalStock = rentalProduct.stock_qty || 0

    const bookedInCart = await getBookedQuantityInCart(productId, startDate, endDate)
    const bookedInOrders = await getBookedQuantityInOrders(productId, startDate, endDate)

    const totalBooked = bookedInCart + bookedInOrders

    const availableQty = totalStock - totalBooked

    return {
      available: availableQty > 0,
      stockQty: totalStock,
      bookedQty: totalBooked,
      availableQty: availableQty
    }
  } catch (error) {
    console.error('Error checking rental availability:', error)
    return { available: false, stockQty: 0, bookedQty: 0, availableQty: 0 }
  }
}

/**
 * Obtiene la cantidad de unidades reservadas en carritos activos para un período
 */
async function getBookedQuantityInCart(productId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        rental_cart_items!inner(start_date, end_date)
      `)
      .eq('product_id', productId)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`, { foreignTable: 'rental_cart_items' })

    if (error) {
      console.error('Error fetching cart bookings:', error)
      return 0
    }

    return data ? data.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0
  } catch (error) {
    console.error('Error in getBookedQuantityInCart:', error)
    return 0
  }
}

/**
 * Obtiene la cantidad de unidades reservadas en órdenes activas para un período
 */
async function getBookedQuantityInOrders(productId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        rental_order_items!inner(start_date, end_date),
        orders!inner(status)
      `)
      .eq('product_id', productId)
      .in('orders.status', ['CREATED', 'PAID'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`, { foreignTable: 'rental_order_items' })

    if (error) {
      console.error('Error fetching order bookings:', error)
      return 0
    }

    return data ? data.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0
  } catch (error) {
    console.error('Error in getBookedQuantityInOrders:', error)
    return 0
  }
}

/**
 * Calcula el precio total para un alquiler según el período
 * @param {string} productId - ID del producto
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<number>} - Precio total del alquiler
 */
export async function calculateRentalPrice(productId, startDate, endDate) {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const { data: pricing, error } = await supabase
      .from('rental_pricing')
      .select('price, period')
      .eq('product_id', productId)
      .order('period', { ascending: false })

    if (error || !pricing || pricing.length === 0) {
      console.error('Error fetching rental pricing:', error)
      return 0
    }

    const dailyPrice = pricing[0].price
    return dailyPrice * totalDays
  } catch (error) {
    console.error('Error calculating rental price:', error)
    return 0
  }
}
