/**
 * Middleware de protección de rutas para el panel de administración.
 * Propósito: Asegurar que solo los administradores puedan acceder
 * a las rutas dentro de `/admin`.
 * Funcionamiento: En `requireAdmin`, verifica la sesión de Supabase.
 * Si no hay sesión, redirige inmediatamente a `/admin/login`. Si existe una sesión,
 * consulta `is_admin` en la base (tabla `user_roles`), el mismo criterio que usan las políticas RLS.
 * Si no es admin, cierra la sesión por seguridad y redirige al login de administración.
 * Si todo es correcto, permite la navegación (`next()`).
 */
import { supabase } from '../services/supabase'
import { isAdmin } from '../services/admin'

export async function requireAdmin(to, from, next) {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
        return next('/admin/login')
    }

    const admin = await isAdmin(data.user.id).catch(() => false)

    if (!admin) {
        await supabase.auth.signOut()
        return next('/admin/login')
    }

    next()
}
