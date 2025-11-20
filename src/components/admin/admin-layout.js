/**
 * Este archivo contiene la lógica (JavaScript) del componente de layout principal del panel de administración.
 * Propósito: Gestionar el estado de la sesión del administrador y la funcionalidad del menú de usuario.
 * Funcionamiento: Se suscribe a los cambios de autenticación para mostrar los datos del administrador (`this.user`).
 * Controla la visibilidad del menú desplegable con `toggleUserMenu` y `closeUserMenu`.
 * Al hacer clic en cualquier lugar fuera del menú, este se cierra automáticamente (listener `mounted`).
 * La función `handleLogout` cierra la sesión y redirige al login de administración.
 */

import { subscribeToAuthStateChanges, logout } from '../../services/auth'
import Sidebar from './Sidebar.vue'

export default {
    name: 'AdminLayout',
    components: {
        Sidebar
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
                avatar_url: null,
            },
            showUserMenu: false
        }
    },
    methods: {
        toggleUserMenu() {
            this.showUserMenu = !this.showUserMenu
        },
        closeUserMenu() {
            this.showUserMenu = false
        },
        async handleLogout() {
            await logout()
            this.$router.push('/admin/login')
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu-container')) {
                this.closeUserMenu()
            }
        })
    }
}
