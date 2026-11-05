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
import { getUserProfileById, updateUserData } from './user-profiles'

const EMPTY_USER = {
    id: null,
    email: null,
    username: null,
    first_name: null,
    last_name: null,
    bio: null,
    avatar_url: null,
    location: null,
}

// Estado local del usuario (inicialmente vacío)
let user = { ...EMPTY_USER }

let observers = []

// Initialize from Supabase session and subscribe to changes
loadCurrentUserAuthState()
subscribeToSupabaseAuth()

async function loadCurrentUserAuthState() {
  try {
    // getSession lee la sesión guardada sin ir al servidor (evita 403 con sesiones vencidas)
    const { data } = await supabase.auth.getSession()
    const sUser = data?.session?.user
    if (!sUser) return
    setUser({ id: sUser.id, email: sUser.email })
    fetchFullProfile()
  } catch {}
}

function subscribeToSupabaseAuth() {
  supabase.auth.onAuthStateChange((_event, session) => {
    const sUser = session?.user
    if (!sUser) {
      setUser({ ...EMPTY_USER })
      return
    }
    setUser({ id: sUser.id, email: sUser.email })
    fetchFullProfile().catch(() => {})
    // Outside the callback: supabase-js can deadlock if it is called from inside it
    setTimeout(() => closeSessionIfDeactivated(sUser.id), 0)
  })
}

export const DEACTIVATED_MESSAGE = 'Tu cuenta fue dada de baja. Si creés que es un error, escribinos a soporte.'

async function isAccountActive(userId) {
  const { data } = await supabase.from('users').select('is_active').eq('id', userId).maybeSingle()
  return data?.is_active !== false
}

// Covers sessions that were already open when an admin deactivated the account
async function closeSessionIfDeactivated(userId) {
  if (!(await isAccountActive(userId))) {
    await supabase.auth.signOut({ scope: 'local' })
  }
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
    if (message === DEACTIVATED_MESSAGE) return message
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
    if (!(await isAccountActive(data.user.id))) {
        await supabase.auth.signOut({ scope: 'local' })
        throw new Error(DEACTIVATED_MESSAGE)
    }
    setUser({ id: data.user.id, email: data.user.email })
    try { await fetchFullProfile() } catch {}
}

export async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
}

export async function logout() {
    await supabase.auth.signOut()
    setUser({ ...EMPTY_USER })
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

export async function deleteOwnAccount() {
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
        throw new Error(error.message.includes('has_orders') ? 'has_orders' : 'No se pudo eliminar la cuenta. Intentá de nuevo más tarde.')
    }
    // The user no longer exists on the server, so only the local session is cleared
    await supabase.auth.signOut({ scope: 'local' })
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) throw new Error('Las contraseñas nuevas no coinciden')
    if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
    if (newPassword === currentPassword) throw new Error('La contraseña nueva debe ser distinta a la actual')

    const { data } = await supabase.auth.getUser()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: data.user?.email, password: currentPassword })
    if (loginError) throw new Error('La contraseña actual es incorrecta')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error('No se pudo cambiar la contraseña. Intentá de nuevo más tarde.')
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
