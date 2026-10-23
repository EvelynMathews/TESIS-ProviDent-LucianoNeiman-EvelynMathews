/**
 * Servicio de gestión de los datos detallados del perfil de usuario.
 * Propósito: Encapsular la lógica para obtener, crear y actualizar los datos
 * del perfil de un usuario, combinando información de las tablas `users`
 * (datos de autenticación) y `user_profiles` (datos extendidos).
 * Funcionamiento: `getUserProfileById` realiza consultas para combinar los datos.
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
 * Obtiene el perfil completo de un usuario por su ID.
 * Combina datos de las tablas users y user_profiles.
 */
export async function getUserProfileById(id) {
    // La vista public_user_profiles solo expone nombre, apellido y avatar.
    // Bio y ubicación viven en user_profiles, así que se leen aparte y se combinan.
    const [{ data: viewData, error: profileError }, { data: extra }] = await Promise.all([
        supabase.from('public_user_profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('user_profiles').select('bio, location').eq('user_id', id).maybeSingle(),
    ])
    const profileData = viewData ? { ...viewData, bio: extra?.bio ?? viewData.bio, location: extra?.location ?? viewData.location } : null

    if (profileError) {
        console.error('[user-profiles.js getUserProfileById] Error al traer datos de public_user_profiles:', id, profileError)
        throw new Error(profileError.message)
    }

    // Perfil inexistente (ej. enlace viejo): lo informa quien llama, no es un error de red
    if (!profileData) return null

    // Combinar nombre completo como username si no existe
    const username = profileData.username || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Usuario'

    // El bucket de avatares es privado: se usa URL firmada (la URL pública devuelve 400)
    let avatarUrl = ''
    if (profileData.avatar_url) {
        avatarUrl = await signedAvatarUrl(profileData.avatar_url)
    } else if (profileData.photo_url) {
        avatarUrl = profileData.photo_url
    }

    return {
        id: profileData.id,
        username: username,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        photo_url: profileData.photo_url,
        avatar_path: profileData.avatar_url || null,
        avatar_url: avatarUrl,
        bio: profileData.bio || '',
        location: profileData.location || '',
        is_active: profileData.is_active,
        created_at: profileData.created_at,
    }
}

/**
 * Crea un nuevo perfil de usuario en la tabla `user_profiles`.
 */
export async function createUserProfile(data) {
    const {
        id,
        email,
        username = null,
        bio = null,
        avatar_url = null,
        favorite_genres = null,
        favorite_directors = null,
        location = null,
        verified = false,
        last_active_at = null,
    } = data

    const { error } = await supabase.from('user_profiles').insert([
        {
            id,
            email,
            username,
            bio,
            avatar_url,
            favorite_genres,
            favorite_directors,
            location,
            verified,
            last_active_at,
        },
    ])

    if (error) {
        console.error('[user-profiles.js createUserProfile] Error al crear el perfil del usuario:', id, error)
        throw new Error(error.message)
    }
}

/**
 * Actualiza un perfil existente.
 */
export async function updateUserProfile(id, data) {
    const {
        username,
        bio,
        avatar_url,
        favorite_genres,
        favorite_directors,
        location,
        verified,
        last_active_at,
    } = data

    const { error } = await supabase
        .from('user_profiles')
        .update({
            username,
            bio,
            avatar_url,
            favorite_genres,
            favorite_directors,
            location,
            verified,
            last_active_at,
        })
        .eq('id', id)

    if (error) {
        console.error('[user-profiles.js updateUserProfile] Error al actualizar el perfil del usuario:', id, error)
        throw new Error(error.message)
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
    if (data.photo_url !== undefined) usersData.photo_url = data.photo_url

    // Campos de la tabla user_profiles
    if (data.bio !== undefined) profilesData.bio = data.bio
    if (data.location !== undefined) profilesData.location = data.location
    if (data.avatar !== undefined) profilesData.avatar = data.avatar
    if (data.avatar_url !== undefined) profilesData.avatar = data.avatar_url // alias

    // Actualizar users si hay cambios
    if (Object.keys(usersData).length > 0) {
        const { error: usersError } = await supabase
            .from('users')
            .update(usersData)
            .eq('id', userId)

        if (usersError) {
            console.error('[user-profiles.js updateUserData] Error al actualizar users:', userId, usersError)
            throw new Error(usersError.message)
        }
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
