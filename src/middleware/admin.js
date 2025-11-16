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
