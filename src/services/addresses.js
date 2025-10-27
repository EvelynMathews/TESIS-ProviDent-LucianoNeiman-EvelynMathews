/**
 * Servicio de Direcciones
 *
 * Maneja operaciones relacionadas con direcciones de usuarios.
 */

import { supabase } from './supabase'

/**
 * Obtiene todas las direcciones de un usuario.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Array de direcciones
 * @throws {Error} Si hay error en la consulta
 */
export async function getUserAddresses(userId) {
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[addresses.js getUserAddresses] Error:', error)
        throw new Error(`Error al obtener direcciones: ${error.message}`)
    }

    return data
}

/**
 * Obtiene la dirección primaria de un usuario.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Dirección primaria o null
 * @throws {Error} Si hay error en la consulta
 */
export async function getPrimaryAddress(userId) {
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[addresses.js getPrimaryAddress] Error:', error)
        throw new Error(`Error al obtener dirección primaria: ${error.message}`)
    }

    return data
}

/**
 * Crea una nueva dirección para un usuario.
 *
 * @param {Object} addressData - Datos de la dirección
 * @param {string} addressData.user_id - ID del usuario
 * @param {string} addressData.street - Calle y número
 * @param {string} addressData.city - Ciudad
 * @param {string} addressData.province - Provincia
 * @param {string} [addressData.postal_code] - Código postal
 * @param {string} [addressData.country] - País
 * @param {boolean} [addressData.is_primary] - Si es dirección primaria
 * @returns {Promise<Object>} Dirección creada
 * @throws {Error} Si faltan datos o hay error al crear
 */
export async function createAddress(addressData) {
    const { user_id, street, city, province, postal_code, country, is_primary } = addressData

    // Validaciones
    if (!user_id) {
        throw new Error('user_id es requerido')
    }
    if (!city || !province) {
        throw new Error('Ciudad y provincia son requeridas')
    }

    // Si es dirección primaria, primero quitar el flag de otras direcciones
    if (is_primary) {
        await supabase
            .from('addresses')
            .update({ is_primary: false })
            .eq('user_id', user_id)
    }

    const { data, error } = await supabase
        .from('addresses')
        .insert([{
            user_id,
            street: street || null,
            city,
            province,
            postal_code: postal_code || null,
            country: country || 'Argentina',
            is_primary: is_primary || false
        }])
        .select()
        .single()

    if (error) {
        console.error('[addresses.js createAddress] Error:', error)
        throw new Error(`Error al crear dirección: ${error.message}`)
    }

    return data
}

/**
 * Actualiza una dirección existente.
 *
 * @param {string} addressId - ID de la dirección
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Dirección actualizada
 * @throws {Error} Si hay error al actualizar
 */
export async function updateAddress(addressId, updates) {
    if (!addressId) {
        throw new Error('addressId es requerido')
    }

    // Si se está marcando como primaria, quitar flag de otras direcciones del mismo usuario
    if (updates.is_primary) {
        // Primero obtener la dirección para saber el user_id
        const { data: currentAddress } = await supabase
            .from('addresses')
            .select('user_id')
            .eq('id', addressId)
            .single()

        if (currentAddress) {
            await supabase
                .from('addresses')
                .update({ is_primary: false })
                .eq('user_id', currentAddress.user_id)
                .neq('id', addressId)
        }
    }

    const { data, error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', addressId)
        .select()
        .single()

    if (error) {
        console.error('[addresses.js updateAddress] Error:', error)
        throw new Error(`Error al actualizar dirección: ${error.message}`)
    }

    return data
}

/**
 * Elimina una dirección.
 *
 * @param {string} addressId - ID de la dirección
 * @returns {Promise<void>}
 * @throws {Error} Si hay error al eliminar
 */
export async function deleteAddress(addressId) {
    if (!addressId) {
        throw new Error('addressId es requerido')
    }

    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)

    if (error) {
        console.error('[addresses.js deleteAddress] Error:', error)
        throw new Error(`Error al eliminar dirección: ${error.message}`)
    }
}

/**
 * Establece una dirección como primaria.
 *
 * @param {string} addressId - ID de la dirección
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Dirección actualizada
 * @throws {Error} Si hay error al actualizar
 */
export async function setAsPrimary(addressId, userId) {
    if (!addressId || !userId) {
        throw new Error('addressId y userId son requeridos')
    }

    // Quitar flag primary de todas las direcciones del usuario
    await supabase
        .from('addresses')
        .update({ is_primary: false })
        .eq('user_id', userId)

    // Marcar la nueva como primaria
    const { data, error } = await supabase
        .from('addresses')
        .update({ is_primary: true })
        .eq('id', addressId)
        .select()
        .single()

    if (error) {
        console.error('[addresses.js setAsPrimary] Error:', error)
        throw new Error(`Error al establecer dirección primaria: ${error.message}`)
    }

    return data
}
