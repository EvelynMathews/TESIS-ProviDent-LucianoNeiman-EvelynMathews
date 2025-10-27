import { supabase } from './supabase'

/**
 * Obtiene el perfil completo de un usuario por su ID.
 * Combina datos de `users` y `user_profiles`.
 * Solo accesible por el dueño del perfil o admin.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Perfil completo del usuario
 * @throws {Error} Si hay error al obtener el perfil
 */
export async function getUserProfileById(userId) {
    try {
        // Obtener datos de users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, photo_url')
            .eq('id', userId)
            .single()

        if (userError) {
            console.error('[user-profiles.js getUserProfileById] Error al traer datos de users:', userId, userError)
            throw new Error(userError.message)
        }

        // Obtener datos de user_profiles
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, avatar_url, bio, location, is_public, created_at, updated_at')
            .eq('user_id', userId)
            .maybeSingle()

        if (profileError) {
            console.error('[user-profiles.js getUserProfileById] Error al traer datos de user_profiles:', userId, profileError)
            throw new Error(profileError.message)
        }

        // Combinar ambos objetos
        return {
            id: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            photo_url: userData.photo_url,
            avatar_url: profileData?.avatar_url || null,
            bio: profileData?.bio || '',
            location: profileData?.location || '',
            is_public: profileData?.is_public ?? true,
            created_at: profileData?.created_at || null,
            updated_at: profileData?.updated_at || null,
        }
    } catch (error) {
        console.error('[user-profiles.js getUserProfileById] Error:', error)
        throw error
    }
}

/**
 * Obtiene el perfil público de un usuario.
 * Usa la vista `public_user_profiles` que solo expone datos públicos.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Perfil público (id, first_name, last_name, avatar_url)
 * @throws {Error} Si hay error al obtener el perfil
 */
export async function getPublicProfile(userId) {
    const { data, error } = await supabase
        .from('public_user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('[user-profiles.js getPublicProfile] Error:', userId, error)
        throw new Error(error.message)
    }

    return data
}

/**
 * Lista perfiles públicos de usuarios.
 * Útil para buscar usuarios o mostrar listados.
 *
 * @param {Object} options - Opciones de búsqueda
 * @param {string} [options.query] - Término de búsqueda (nombre o apellido)
 * @param {number} [options.limit=20] - Límite de resultados
 * @returns {Promise<Array>} Array de perfiles públicos
 * @throws {Error} Si hay error en la consulta
 */
export async function listPublicProfiles(options = {}) {
    const { query = null, limit = 20 } = options

    let queryBuilder = supabase
        .from('public_user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .limit(limit)

    // Si hay término de búsqueda, filtrar por nombre o apellido
    if (query && query.trim().length > 0) {
        const searchTerm = query.trim()
        queryBuilder = queryBuilder.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    }

    const { data, error } = await queryBuilder

    if (error) {
        console.error('[user-profiles.js listPublicProfiles] Error:', error)
        throw new Error(error.message)
    }

    return data
}

/**
 * Crea un nuevo perfil de usuario en la tabla `user_profiles`.
 *
 * @param {Object} data - Datos del perfil
 * @param {string} data.user_id - ID del usuario (obligatorio)
 * @param {string} [data.avatar_url] - URL del avatar
 * @param {string} [data.bio] - Biografía
 * @param {string} [data.location] - Ubicación
 * @param {boolean} [data.is_public] - Si el perfil es público
 * @returns {Promise<void>}
 * @throws {Error} Si hay error al crear el perfil
 */
export async function createUserProfile(data) {
    const {
        user_id,
        avatar_url = null,
        bio = '',
        location = '',
        is_public = true,
    } = data

    if (!user_id) {
        throw new Error('user_id es requerido')
    }

    const { error } = await supabase.from('user_profiles').insert([
        {
            user_id,
            avatar_url,
            bio,
            location,
            is_public,
        },
    ])

    if (error) {
        console.error('[user-profiles.js createUserProfile] Error al crear perfil:', user_id, error)
        throw new Error(error.message)
    }

    console.log('[user-profiles.js createUserProfile] Perfil creado exitosamente:', user_id)
}

/**
 * Actualiza el perfil de un usuario existente.
 * Solo actualiza campos de `user_profiles`, no de `users`.
 *
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Campos a actualizar
 * @param {string} [updates.avatar_url] - URL del avatar
 * @param {string} [updates.bio] - Biografía
 * @param {string} [updates.location] - Ubicación
 * @param {boolean} [updates.is_public] - Si el perfil es público
 * @returns {Promise<void>}
 * @throws {Error} Si hay error al actualizar
 */
export async function updateUserProfile(userId, updates) {
    if (!userId) {
        throw new Error('userId es requerido')
    }

    // Solo permitir actualizar estos campos
    const allowedFields = ['avatar_url', 'bio', 'location', 'is_public']
    const sanitized = {}

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            sanitized[field] = updates[field]
        }
    }

    if (Object.keys(sanitized).length === 0) {
        console.warn('[user-profiles.js updateUserProfile] No hay campos para actualizar')
        return
    }

    const { error } = await supabase
        .from('user_profiles')
        .update(sanitized)
        .eq('user_id', userId)

    if (error) {
        console.error('[user-profiles.js updateUserProfile] Error al actualizar perfil:', userId, error)
        throw new Error(error.message)
    }

    console.log('[user-profiles.js updateUserProfile] Perfil actualizado:', userId)
}

/**
 * Elimina el perfil de un usuario.
 * NOTA: Esto solo elimina la fila de user_profiles, NO elimina el usuario de auth.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 * @throws {Error} Si hay error al eliminar
 */
export async function deleteUserProfile(userId) {
    if (!userId) {
        throw new Error('userId es requerido')
    }

    const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)

    if (error) {
        console.error('[user-profiles.js deleteUserProfile] Error al eliminar perfil:', userId, error)
        throw new Error(error.message)
    }

    console.log('[user-profiles.js deleteUserProfile] Perfil eliminado:', userId)
}
