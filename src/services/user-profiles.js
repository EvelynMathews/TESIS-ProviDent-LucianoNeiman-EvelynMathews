import { supabase } from './supabase'

/**
 * Obtiene el perfil completo de un usuario por su ID.
 * Combina datos de las tablas users y user_profiles.
 */
export async function getUserProfileById(id) {
    // Obtener datos de users
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, photo_url, is_active, created_at')
        .eq('id', id)
        .single()

    if (userError) {
        console.error('[user-profiles.js getUserProfileById] Error al traer datos de users:', id, userError)
        throw new Error(userError.message)
    }

    // Obtener datos de user_profiles
    const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('bio, location, avatar, is_public, created_at, updated_at')
        .eq('user_id', id)
        .single()

    // Si no existe el perfil, devolver solo los datos de users
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[user-profiles.js getUserProfileById] Error al traer user_profiles:', id, profileError)
    }

    // Combinar ambos resultados
    return {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        photo_url: userData.photo_url,
        avatar_url: profileData?.avatar || userData.photo_url || '',
        bio: profileData?.bio || '',
        location: profileData?.location || '',
        is_public: profileData?.is_public ?? true,
        is_active: userData.is_active,
        created_at: userData.created_at,
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
