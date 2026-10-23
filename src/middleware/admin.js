/**
 * Middleware de protección de rutas para el panel de administración.
 * Propósito: Asegurar que solo los usuarios con el rol 'admin' puedan acceder
 * a las rutas dentro de `/admin`.
 * Funcionamiento: En `requireAdmin`, verifica la sesión de Supabase.
 * Si no hay sesión, redirige inmediatamente a `/admin/login`. Si existe una sesión,
 * verifica que el usuario tenga `user_metadata.role` igual a 'admin'.
 * Si el rol no es 'admin', redirige al login de administración con un aviso (sin cerrar la sesión del usuario).
 * Si todo es correcto, permite la navegación (`next()`).
 */
import { supabase } from '../services/supabase'

export async function requireAdmin(to, from, next) {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
        return next('/admin/login')
    }

    const role = data.user.user_metadata?.role

    if (role !== 'admin') {
        // No es admin: se le niega el acceso sin cerrar su sesión de comprador/vendedor
        return next({ path: '/admin/login', query: { denied: '1' } })
    }

    next()
}
