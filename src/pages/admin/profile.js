/**
 * Lógica de la vista de perfil para el Administrador.
 * Propósito: Permitir al administrador ver sus estadísticas de gestión y
 * actualizar su información personal y contraseña.
 * Funcionamiento: `loadAdminStats` obtiene métricas clave (productos gestionados/activos).
 * Se suscribe a los cambios de autenticación (`subscribeToAuthStateChanges`)
 * para obtener y precargar los datos del perfil.
 * `updateProfile` utiliza `updateAuthUser` del servicio de autenticación para guardar
 * los cambios de nombre/apellido. `changePassword` verifica la contraseña actual
 * con un re-login y luego la cambia, con validaciones de longitud y coincidencia.
 */

import { subscribeToAuthStateChanges, updateAuthUser, changePassword } from '../../services/auth'
import { supabase } from '../../services/supabase'
import AdminLayout from '../../components/admin/AdminLayout.vue'

export default {
    name: 'AdminProfile',
    components: {
        AdminLayout
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
                avatar_url: null,
            },
            stats: {
                totalProducts: 0,
                activeProducts: 0,
                lastAccess: null
            },
            profileForm: {
                first_name: '',
                last_name: '',
                email: ''
            },
            passwordForm: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            loading: false,
            profileSuccess: false,
            passwordSuccess: false,
            profileError: '',
            passwordError: '',
            statsError: ''
        }
    },
    methods: {
        async loadAdminStats() {
            try {
                const [productsRes, activeProductsRes] = await Promise.all([
                    supabase.from('products').select('id', { count: 'exact', head: true }),
                    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)
                ])

                if (productsRes.error) throw productsRes.error
                if (activeProductsRes.error) throw activeProductsRes.error

                this.stats.totalProducts = productsRes.count || 0
                this.stats.activeProducts = activeProductsRes.count || 0
                this.stats.lastAccess = new Date()

            } catch (error) {
                console.error('Error al cargar estadísticas:', error)
                this.statsError = 'No se pudieron cargar las estadísticas.'
            }
        },
        async updateProfile() {
            this.profileSuccess = false
            this.profileError = ''

            try {
                this.loading = true

                const userData = {
                    first_name: this.profileForm.first_name,
                    last_name: this.profileForm.last_name
                }

                await updateAuthUser(userData)

                this.profileSuccess = true
                setTimeout(() => { this.profileSuccess = false }, 3000)

            } catch (error) {
                this.profileError = error.message || 'Error al actualizar el perfil'
            } finally {
                this.loading = false
            }
        },
        async changePassword() {
            this.passwordSuccess = false
            this.passwordError = ''

            try {
                this.loading = true

                const { currentPassword, newPassword, confirmPassword } = this.passwordForm
                await changePassword(currentPassword, newPassword, confirmPassword)

                this.passwordSuccess = true
                this.passwordForm.currentPassword = ''
                this.passwordForm.newPassword = ''
                this.passwordForm.confirmPassword = ''

                setTimeout(() => { this.passwordSuccess = false }, 3000)

            } catch (error) {
                this.passwordError = error.message
            } finally {
                this.loading = false
            }
        },
        formatDate(date) {
            if (!date) return '-'
            return new Date(date).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
            this.profileForm.first_name = newUserState.first_name || ''
            this.profileForm.last_name = newUserState.last_name || ''
            this.profileForm.email = newUserState.email || ''
        })
        this.loadAdminStats()
    }
}
