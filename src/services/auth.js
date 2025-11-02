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
    const { data } = await supabase.auth.getSession()
    const session = data?.session
    const sUser = session?.user
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
        setUser(fullProfile)
    } catch (error) {
        console.error('[auth.js] Error al cargar perfil completo:', error.message)
    }
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
