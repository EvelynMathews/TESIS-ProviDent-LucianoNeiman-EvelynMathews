/**
 * Servicio de gestión de los datos detallados del perfil de usuario.
 * Propósito: Encapsular la lógica para obtener y actualizar los datos
 * del perfil de un usuario, combinando información de las tablas `users`
 * (datos de la cuenta) y `user_profiles` (perfil público).
 * Funcionamiento: `getUserProfileById` lee todo desde la vista `public_user_profiles`.
 * `updateUserData` se encarga de aplicar los cambios en las tablas correspondientes
 * (`users` para nombre/apellido y `user_profiles` para bio/ubicación/avatar).
 */

import { supabase } from './supabase'

/**
 * Devuelve una URL firmada (1 hora) para un avatar guardado en Storage.
 * Si la ruta ya es una URL completa, la devuelve tal cual.
 */
export async function signedAvatarUrl(path) {
    if (!path) return ''
    if (/^https?:\/\//.test(path)) return path
    try {
        const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60)
        if (!error && data?.signedUrl) return data.signedUrl
    } catch { /* sin avatar: se muestran las iniciales */ }
    return ''
}

/**
 * Obtiene el perfil de un usuario por su ID desde la vista public_user_profiles
 * (nombre, apellido, avatar, bio y ubicación).
 */
export async function getUserProfileById(id) {
    const { data: profileData, error: profileError } = await supabase
        .from('public_user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (profileError) {
        console.error('[user-profiles.js getUserProfileById] Error al traer datos de public_user_profiles:', id, profileError)
        throw new Error(profileError.message)
    }

    // Perfil inexistente (ej. enlace viejo): lo informa quien llama, no es un error de red
    if (!profileData) return null

    const username = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Usuario'

    // El bucket de avatares es privado: se usa URL firmada (la URL pública devuelve 400)
    let avatarUrl = ''
    if (profileData.avatar_url) {
        avatarUrl = await signedAvatarUrl(profileData.avatar_url)
    }

    return {
        id: profileData.id,
        username: username,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        avatar_path: profileData.avatar_url || null,
        avatar_url: avatarUrl,
        bio: profileData.bio || '',
        location: profileData.location || '',
    }
}

/**
 * Actualiza los datos del usuario en la tabla users y user_profiles
 */
export async function updateUserData(userId, data) {
    // Separar datos de users vs user_profiles
    const usersData = {}
    const profilesData = {}

    // Campos de la tabla users
    if (data.first_name !== undefined) usersData.first_name = data.first_name
    if (data.last_name !== undefined) usersData.last_name = data.last_name

    // Campos de la tabla user_profiles
    if (data.bio !== undefined) profilesData.bio = data.bio
    if (data.location !== undefined) profilesData.location = data.location
    if (data.avatar !== undefined) profilesData.avatar = data.avatar
    if (data.avatar_url !== undefined) profilesData.avatar = data.avatar_url // alias

    // Actualizar users si hay cambios
    if (Object.keys(usersData).length > 0) {
        const { data: updated, error: usersError } = await supabase
            .from('users')
            .update(usersData)
            .eq('id', userId)
            .select('id')

        if (usersError) {
            console.error('[user-profiles.js updateUserData] Error al actualizar users:', userId, usersError)
            throw new Error(usersError.message)
        }
        if (!updated?.length) throw new Error('No se pudieron guardar los datos del usuario')
    }

    // Actualizar user_profiles si hay cambios
    if (Object.keys(profilesData).length > 0) {
        // upsert: si el usuario todavía no tiene fila en user_profiles, se crea (un update la ignoraría en silencio)
        const { error: profilesError } = await supabase
            .from('user_profiles')
            .upsert({ user_id: userId, ...profilesData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

        if (profilesError) {
            console.error('[user-profiles.js updateUserData] Error al actualizar user_profiles:', userId, profilesError)
            throw new Error(profilesError.message)
        }
    }
}
