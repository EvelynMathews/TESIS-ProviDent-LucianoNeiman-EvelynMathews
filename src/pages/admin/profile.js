import { subscribeToAuthStateChanges, updateAuthUser } from '../../services/auth'
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
            passwordError: ''
        }
    },
    methods: {
        async loadAdminStats() {
            try {
                const [productsRes, activeProductsRes] = await Promise.all([
                    supabase.from('products').select('id', { count: 'exact', head: true }),
                    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)
                ])

                this.stats.totalProducts = productsRes.count || 0
                this.stats.activeProducts = activeProductsRes.count || 0
                this.stats.lastAccess = new Date()

            } catch (error) {
                console.error('Error al cargar estadísticas:', error)
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

            if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
                this.passwordError = 'Las contraseñas no coinciden'
                return
            }

            if (this.passwordForm.newPassword.length < 6) {
                this.passwordError = 'La contraseña debe tener al menos 6 caracteres'
                return
            }

            try {
                this.loading = true

                const { error } = await supabase.auth.updateUser({
                    password: this.passwordForm.newPassword
                })

                if (error) throw error

                this.passwordSuccess = true
                this.passwordForm.currentPassword = ''
                this.passwordForm.newPassword = ''
                this.passwordForm.confirmPassword = ''

                setTimeout(() => { this.passwordSuccess = false }, 3000)

            } catch (error) {
                this.passwordError = error.message || 'Error al cambiar la contraseña'
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
            if (newUserState.username) {
                const parts = newUserState.username.split(' ')
                this.profileForm.first_name = parts[0] || ''
                this.profileForm.last_name = parts.slice(1).join(' ') || ''
            }
            this.profileForm.email = newUserState.email || ''
        })
        this.loadAdminStats()
    }
}
