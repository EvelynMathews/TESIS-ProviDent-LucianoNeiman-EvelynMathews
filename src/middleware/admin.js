/**
 * Middleware de protección de rutas para el panel de administración.
 * Propósito: Asegurar que solo los usuarios con el rol 'admin' puedan acceder
 * a las rutas dentro de `/admin`.
 * Funcionamiento: En `requireAdmin`, verifica la sesión de Supabase.
 * Si no hay sesión o el usuario no tiene `user_metadata.role` igual a 'admin',
 * cierra la sesión por seguridad y redirige al login de administración.
 */
import { supabase } from '../services/supabase'

export async function requireAdmin(to, from, next) {
    const { data } = await supabase.auth.getSession()

    if (!data?.session?.user) {
        return next('/admin/login')
    }

    const role = data.session.user.user_metadata?.role

    if (role !== 'admin') {
        // No es admin, hacer logout y redirigir
        await supabase.auth.signOut()
        return next('/admin/login')
    }

    next()
}
