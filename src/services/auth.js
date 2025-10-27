import { supabase } from './supabase'
import { createUserProfile, getUserProfileById, updateUserProfile } from './user-profiles'

// Estado local del usuario (inicialmente vacío)
let user = {
    id: null,
    email: null,
    username: null,
    bio: null,
    avatar_url: null,
    favorite_genres: null,
    favorite_directors: null,
    location: null,
    verified: false,
}

let observers = []

// Cargar estado de autenticación al iniciar
loadCurrentUserAuthState()

async function loadCurrentUserAuthState() {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        return
    }

    setUser({
        id: data.user.id,
        email: data.user.email,
    })

    fetchFullProfile()
}

async function fetchFullProfile() {
    try {
        const fullProfile = await getUserProfileById(user.id)
        setUser(fullProfile)
    } catch (error) {
        console.error('[auth.js] Error al cargar perfil completo:', error.message)
    }
}

/**
 * Registra un nuevo usuario en Supabase Auth y crea su perfil.
 *
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @param {Object} userData - Datos adicionales del usuario
 * @param {string} [userData.name] - Nombre
 * @param {string} [userData.lastName] - Apellido
 * @param {string} [userData.city] - Ciudad
 * @param {string} [userData.province] - Provincia
 * @returns {Promise<void>}
 * @throws {Error} Si el registro falla
 *
 * @example
 * await register('user@example.com', 'password123', {
 *   name: 'Juan',
 *   lastName: 'Pérez',
 *   city: 'CABA',
 *   province: 'Buenos Aires'
 * });
 */
export async function register(email, password, userData = {}) {
    try {
        const firstName = userData.name || ''
        const lastName = userData.lastName || ''
        const username = firstName && lastName
            ? `${firstName} ${lastName}`
            : email.split('@')[0]

        // Registrar en Supabase Auth con metadata completo
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    first_name: firstName,
                    last_name: lastName,
                    phone: userData.phone || null
                }
            }
        })

        if (error) {
            throw new Error(error.message)
        }

        // Actualizar la tabla users con first_name, last_name y phone
        // (por si el trigger no lo hace automáticamente)
        const { error: updateError } = await supabase
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName,
                phone: userData.phone || null
            })
            .eq('id', data.user.id)

        if (updateError) {
            console.warn('[auth.js register] No se pudo actualizar users:', updateError.message)
        }

        // Crear perfil de usuario en la tabla user_profiles
        await createUserProfile({
            user_id: data.user.id,
            avatar_url: null,
            bio: '',
            location: userData.city && userData.province
                ? `${userData.city}, ${userData.province}`
                : '',
            is_public: true,
        })

        // Actualizar estado local
        setUser({
            id: data.user.id,
            email: data.user.email,
            username: username,
            bio: '',
            avatar_url: null,
            location: userData.city && userData.province
                ? `${userData.city}, ${userData.province}`
                : '',
            verified: false,
        })

        console.log('[auth.js] Usuario registrado exitosamente:', data.user.id)

    } catch (error) {
        console.error('[auth.js register] Error:', error)
        throw error
    }
}

/**
 * Inicia sesión con email y contraseña.
 *
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<void>}
 * @throws {Error} Si las credenciales son inválidas
 *
 * @example
 * await login('user@example.com', 'password123');
 */
export async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            throw new Error(error.message)
        }

        setUser({
            id: data.user.id,
            email: data.user.email,
        })

        // Cargar perfil completo
        await fetchFullProfile()

        console.log('[auth.js] Login exitoso:', data.user.id)

    } catch (error) {
        console.error('[auth.js login] Error:', error)
        throw error
    }
}

/**
 * Cierra la sesión del usuario actual.
 *
 * @returns {Promise<void>}
 *
 * @example
 * await logout();
 */
export async function logout() {
    await supabase.auth.signOut()

    setUser({
        id: null,
        email: null,
        username: null,
        bio: null,
        avatar_url: null,
        favorite_genres: null,
        favorite_directors: null,
        location: null,
        verified: false,
    })

    console.log('[auth.js] Logout exitoso')
}

/**
 * Actualiza los datos del usuario autenticado.
 *
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<void>}
 * @throws {Error} Si la actualización falla
 *
 * @example
 * await updateAuthUser({
 *   username: 'Nuevo nombre',
 *   bio: 'Nueva biografía'
 * });
 */
export async function updateAuthUser(data) {
    try {
        await updateUserProfile(user.id, data)
        setUser(data)
    } catch (error) {
        throw error
    }
}

/**
 * Suscribe un callback para recibir cambios en el estado de autenticación.
 *
 * @param {Function} callback - Función que recibe el usuario actual
 * @returns {Function} Función para desuscribirse
 *
 * @example
 * const unsubscribe = subscribeToAuthStateChanges((user) => {
 *   console.log('Usuario actual:', user);
 * });
 *
 * // Más tarde...
 * unsubscribe();
 */
export function subscribeToAuthStateChanges(callback) {
    observers.push(callback)
    notify(callback)

    // Retornar función para "desuscribirse"
    return () => {
        observers = observers.filter(obs => callback != obs)
    }
}

/**
 * Obtiene el usuario actualmente autenticado.
 *
 * @returns {Object} Usuario actual (null si no hay sesión)
 *
 * @example
 * const currentUser = getCurrentUser();
 * if (currentUser.id) {
 *   console.log('Usuario logueado:', currentUser.email);
 * }
 */
export function getCurrentUser() {
    return { ...user }
}

/**
 * Verifica si hay un usuario autenticado.
 *
 * @returns {boolean} true si hay usuario logueado
 *
 * @example
 * if (isAuthenticated()) {
 *   // Mostrar contenido protegido
 * }
 */
export function isAuthenticated() {
    return user.id !== null
}

function notify(callback) {
    callback({ ...user }) // se pasa una copia
}

function notifyAll() {
    observers.forEach(notify)
}

function setUser(data) {
    user = {
        ...user,
        ...data,
    }
    notifyAll()
}
