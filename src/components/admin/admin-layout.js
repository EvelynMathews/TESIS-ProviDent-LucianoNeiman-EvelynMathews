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
