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
 * Obtiene el perfil de un usuario por su ID desde la vista public_user_profiles
 * (nombre, apellido, avatar, bio y ubicación).
 */
export async function getUserProfileById(id) {
    const { data: profileData, error: profileError } = await supabase
        .from('public_user_profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (profileError) {
        console.error('[user-profiles.js getUserProfileById] Error al traer datos de public_user_profiles:', id, profileError)
        throw new Error(profileError.message)
    }

    const username = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Usuario'

    let avatarUrl = ''
    if (profileData.avatar_url) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url)
        avatarUrl = urlData?.publicUrl || ''
    }

    return {
        id: profileData.id,
        username: username,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
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
        const { error: profilesError } = await supabase
            .from('user_profiles')
            .update(profilesData)
            .eq('user_id', userId)

        if (profilesError) {
            console.error('[user-profiles.js updateUserData] Error al actualizar user_profiles:', userId, profilesError)
            throw new Error(profilesError.message)
        }
    }
}
