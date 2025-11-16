export default {
    name: 'Sidebar',
    data() {
        return {
            menuItems: [
                {
                    name: 'Dashboard',
                    path: '/admin/dashboard',
                    icon: 'dashboard'
                },
                {
                    name: 'Productos',
                    path: '/admin/products',
                    icon: 'products'
                },
                {
                    name: 'Mi Perfil',
                    path: '/admin/profile',
                    icon: 'profile'
                }
            ]
        }
    },
    computed: {
        currentPath() {
            return this.$route.path
        }
    }
}
