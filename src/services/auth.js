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

// MODO MOCK: Comentado para no cargar desde Supabase
// loadCurrentUserAuthState()

async function loadCurrentUserAuthState() {
    // TODO: Cuando quieras conectar con Supabase, descomenta este código:
    /*
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        return
    }

    setUser({
        id: data.user.id,
        email: data.user.email,
    })

    fetchFullProfile()
    */
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
    try {
        // MODO MOCK: Simular registro sin tocar Supabase
        const mockUserId = 'mock-user-' + Date.now()
        const username = userData.name && userData.lastName
            ? `${userData.name} ${userData.lastName}`
            : email.split('@')[0]

        // Simular usuario registrado exitosamente
        setUser({
            id: mockUserId,
            email: email,
            username: username,
            bio: '',
            avatar_url: null,
            location: userData.city && userData.province
                ? `${userData.city}, ${userData.province}`
                : '',
            verified: false,
        })

        // Simular un pequeño delay como si fuera una llamada real
        await new Promise(resolve => setTimeout(resolve, 500))

        // TODO: Cuando quieras conectar con Supabase, descomenta este código:
        /*
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (error) {
            throw new Error(error.message)
        }

        await createUserProfile({
            id: data.user.id,
            email: data.user.email,
            username: username,
            bio: '',
            avatar_url: null,
            favorite_genres: '',
            favorite_directors: '',
            location: userData.city && userData.province
                ? `${userData.city}, ${userData.province}`
                : '',
            verified: false,
        })

        setUser({
            id: data.user.id,
            email: data.user.email,
            username: username,
        })
        */
    } catch (error) {
        throw error
    }
}

export async function login(email, password) {
    // MODO MOCK: Simular login sin tocar Supabase
    const mockUserId = 'mock-user-' + Date.now()

    setUser({
        id: mockUserId,
        email: email,
        username: email.split('@')[0],
        bio: '',
        avatar_url: null,
        location: 'CABA, Buenos Aires',
        verified: false,
    })

    // Simular un pequeño delay como si fuera una llamada real
    await new Promise(resolve => setTimeout(resolve, 500))

    // TODO: Cuando quieras conectar con Supabase, descomenta este código:
    /*
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

    fetchFullProfile()
    */
}

export async function logout() {
    // MODO MOCK: No necesitamos llamar a Supabase
    // await supabase.auth.signOut()

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
        await updateUserProfile(user.id, data)
        setUser(data)
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
