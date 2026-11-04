/**
 * Lógica del formulario para editar un usuario desde el Panel de Administración.
 * Propósito: Permitir al administrador corregir el nombre, apellido, biografía y
 * ubicación de un usuario, y darlo de alta o de baja.
 * Funcionamiento: `loadUser` carga el usuario (tabla `users` + `user_profiles`).
 * `saveUser` valida nombre y apellido y guarda con `updateUserByAdmin`.
 * El email no se edita acá porque es el usuario de inicio de sesión de Supabase Auth.
 * Las cuentas de administrador están protegidas: en vez del formulario se muestra un aviso.
 */

import { supabase } from '../../services/supabase'
import { getUserForAdmin, updateUserByAdmin } from '../../services/admin'
import { showToast } from '../../services/toast'
import AdminLayout from '../../components/admin/AdminLayout.vue'

export default {
    name: 'AdminUserEdit',
    components: {
        AdminLayout
    },
    data() {
        return {
            user: null,
            form: null,
            isCurrentUser: false,
            loading: true,
            saving: false,
            loadError: '',
            saveError: '',
            roleLabels: {
                ADMIN: 'Admin',
                SELLER: 'Vendedor',
                BUYER: 'Comprador'
            }
        }
    },
    computed: {
        rolesText() {
            return this.user.roles.map(role => this.roleLabels[role] || role).join(', ') || '-'
        },
        isProtected() {
            return this.user.roles.includes('ADMIN')
        }
    },
    methods: {
        async loadUser() {
            try {
                const user = await getUserForAdmin(this.$route.params.id)
                if (!user) {
                    this.loadError = 'No encontramos este usuario.'
                    return
                }
                const { data } = await supabase.auth.getUser()
                this.isCurrentUser = data?.user?.id === user.id
                this.user = user
                this.form = {
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    bio: user.bio || '',
                    location: user.location || '',
                    is_active: user.is_active
                }
            } catch (error) {
                console.error('Error al cargar el usuario:', error)
                this.loadError = 'No se pudo cargar el usuario. Intentá de nuevo más tarde.'
            } finally {
                this.loading = false
            }
        },
        async saveUser() {
            this.saveError = ''
            if (!this.form.first_name.trim() || !this.form.last_name.trim()) {
                this.saveError = 'Completá el nombre y el apellido'
                return
            }

            this.saving = true
            try {
                await updateUserByAdmin(this.user.id, {
                    first_name: this.form.first_name.trim(),
                    last_name: this.form.last_name.trim(),
                    bio: this.form.bio.trim(),
                    location: this.form.location.trim(),
                    is_active: this.form.is_active
                })
                showToast('Usuario actualizado correctamente')
                this.$router.push('/admin/users')
            } catch (error) {
                console.error('Error al guardar el usuario:', error)
                this.saveError = `No se pudieron guardar los cambios: ${error.message}`
            } finally {
                this.saving = false
            }
        }
    },
    mounted() {
        this.loadUser()
    }
}
