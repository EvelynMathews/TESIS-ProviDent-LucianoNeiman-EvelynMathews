/**
 * Servicio de gestión del estado de autenticación y datos del usuario.
 * Propósito: Centralizar toda la lógica de autenticación (registro, login, logout)
 * utilizando Supabase Auth y mantener un estado reactivo (`user`) que cualquier
 * componente puede suscribir para actualizar su interfaz.
 * Funcionamiento: `subscribeToSupabaseAuth` escucha cambios en Supabase para
 * mantener el estado local sincronizado. `register`, `login` y `logout` interactúan
 * directamente con el SDK de Supabase. `fetchFullProfile` se asegura de obtener
 * datos extendidos de `user_profiles`. El patrón Observer (`subscribeToAuthStateChanges`)
 * notifica a los componentes sobre cualquier cambio en el estado `user`.
 */

import { supabase } from './supabase'
import { getUserProfileById, updateUserProfile, updateUserData } from './user-profiles'

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

// Initialize from Supabase session and subscribe to changes
loadCurrentUserAuthState()
subscribeToSupabaseAuth()

async function loadCurrentUserAuthState() {
  try {
    const { data } = await supabase.auth.getUser()
    const sUser = data?.user
    if (!sUser) return
    setUser({ id: sUser.id, email: sUser.email })
    fetchFullProfile()
  } catch {}
}

function subscribeToSupabaseAuth() {
  supabase.auth.onAuthStateChange((_event, session) => {
    const sUser = session?.user
    if (!sUser) {
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
      return
    }
    setUser({ id: sUser.id, email: sUser.email })
    fetchFullProfile().catch(() => {})
  })
}

async function fetchFullProfile() {
    try {
        const fullProfile = await getUserProfileById(user.id)
        // La vista pública puede no traer el email: se conserva el de la sesión
        if (fullProfile) setUser({ ...fullProfile, email: fullProfile.email || user.email })
    } catch (error) {
        console.error('[auth.js] Error al cargar perfil completo:', error.message)
    }
}


/**
 * Traduce los mensajes de Supabase Auth (en inglés) a mensajes claros en español
 * que explican el problema y qué hacer.
 */
export function translateAuthError(message = '') {
    const m = String(message).toLowerCase()
    if (m.includes('invalid login credentials')) return 'El email o la contraseña no son correctos.'
    if (m.includes('email not confirmed')) return 'Todavía no confirmaste tu email. Revisá tu casilla (y la carpeta de spam).'
    if (m.includes('user already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese email. Probá iniciar sesión.'
    if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (m.includes('unable to validate email') || m.includes('invalid email')) return 'El email no tiene un formato válido.'
    if (m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')) return 'Hiciste demasiados intentos. Esperá un minuto y volvé a probar.'
    if (m.includes('same password') || m.includes('different from the old')) return 'La nueva contraseña tiene que ser distinta a la actual.'
    if (m.includes('failed to fetch') || m.includes('network')) return 'No hay conexión con el servidor. Revisá tu internet.'
    return 'Algo salió mal. Intentá de nuevo en unos segundos.'
}

export async function register(email, password, userData = {}) {
    const firstName = userData.name || ''
    const lastName = userData.lastName || ''
    const location = userData.city && userData.province ? `${userData.city}, ${userData.province}` : ''
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { first_name: firstName, last_name: lastName },
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    })
    if (error) throw new Error(error.message)

    const userId = data.user?.id
    if (!userId) throw new Error('No se pudo crear el usuario')

    // Si hay sesión inmediata = email confirmation deshabilitada
    const hasSession = data.session !== null

    // Solo actualizar perfil si hay sesión (email confirmado)
    if (hasSession) {
        // Actualizar perfil (opcional) con ubicación pública
        if (location) {
            await supabase.from('user_profiles').update({ location }).eq('user_id', userId)
        }

        setUser({ id: userId, email, username: `${firstName} ${lastName}`.trim() })
    }
    // Nota: Avatar se sube después desde /mi-perfil/editar

    // Retornar si requiere confirmación
    return {
        requiresEmailConfirmation: !hasSession,
        userId,
        email
    }
}

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    setUser({ id: data.user.id, email: data.user.email })
    try { await fetchFullProfile() } catch {}
}

export async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
    })
    if (error) throw new Error(error.message)
}

export async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
}

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
}

export async function updateAuthUser(data) {
    try {
        await updateUserData(user.id, data)
        // Recargar el perfil completo después de actualizar
        await fetchFullProfile()
    } catch (error) {
        throw error
    }
}


export function subscribeToAuthStateChanges(callback) {
    observers.push(callback)
    notify(callback)

    // Retornar función para “desuscribirse”
    return () => {
        observers = observers.filter(obs => callback != obs)
    }
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
