/**
 * Lógica de la vista de Usuarios en el Panel de Administración.
 * Propósito: Permitir al administrador ver todos los usuarios, buscarlos,
 * darlos de baja o de alta, y entrar a editar sus datos.
 * Funcionamiento: `loadUsers` trae los usuarios con su perfil y sus roles
 * (RLS solo se los devuelve completos a un admin). `confirmToggle` cambia `users.is_active`:
 * un usuario dado de baja no puede iniciar sesión, publicar ni comprar,
 * y sus productos dejan de verse en el catálogo (lo controla la base con RLS).
 */

import { supabase } from '../../services/supabase'
import { listUsers, setUserActive } from '../../services/admin'
import { showToast } from '../../services/toast'
import AdminLayout from '../../components/admin/AdminLayout.vue'

export default {
    name: 'AdminUsers',
    components: {
        AdminLayout
    },
    data() {
        return {
            users: [],
            currentUserId: null,
            searchQuery: '',
            filterStatus: 'all',
            filterRole: 'all',
            loading: true,
            loadError: '',
            busyId: null,
            userToToggle: null,
            roleLabels: {
                ADMIN: 'Admin',
                SELLER: 'Vendedor',
                BUYER: 'Comprador'
            }
        }
    },
    computed: {
        stats() {
            return {
                total: this.users.length,
                active: this.users.filter(u => u.is_active).length,
                inactive: this.users.filter(u => !u.is_active).length
            }
        },
        filteredUsers() {
            const query = this.searchQuery.trim().toLowerCase()
            return this.users.filter(user => {
                const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
                const matchesText = !query || fullName.includes(query) || user.email?.toLowerCase().includes(query)
                const matchesStatus = this.filterStatus === 'all' || (this.filterStatus === 'active') === user.is_active
                const matchesRole = this.filterRole === 'all' || user.roles.includes(this.filterRole)
                return matchesText && matchesStatus && matchesRole
            })
        }
    },
    methods: {
        async loadUsers() {
            this.loadError = ''
            try {
                this.users = await listUsers()
            } catch (error) {
                console.error('Error al cargar usuarios:', error)
                this.loadError = 'No se pudieron cargar los usuarios. Intentá de nuevo más tarde.'
            } finally {
                this.loading = false
            }
        },
        async confirmToggle() {
            const user = this.userToToggle
            this.busyId = user.id
            try {
                await setUserActive(user.id, !user.is_active)
                user.is_active = !user.is_active
                showToast(`${user.first_name} ${user.last_name} ${user.is_active ? 'fue dado de alta' : 'fue dado de baja'}`)
            } catch (error) {
                showToast(`No se pudo cambiar el estado: ${error.message}`, 'error')
            } finally {
                this.busyId = null
                this.userToToggle = null
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }
    },
    async mounted() {
        const { data } = await supabase.auth.getUser()
        this.currentUserId = data?.user?.id || null
        this.loadUsers()
    }
}
