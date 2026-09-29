/**
 * Este archivo contiene la lógica (JavaScript) de la barra de navegación lateral (Sidebar) del panel de administración.
 * Propósito: Definir los enlaces de navegación disponibles para el administrador.
 * Funcionamiento: Expone una lista fija de `menuItems` (ruta, nombre, ícono)
 * que se iteran en el template. La propiedad computada `currentPath` se utiliza
 * (y `isActive`, que incluye sus subpáginas) para marcar la sección activa.
 */

export default {
    name: 'Sidebar',
    props: {
        // Only used on mobile, where the menu opens from the hamburger button
        open: { type: Boolean, default: false }
    },
    emits: ['navigate'],
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
                    name: 'Anuncios de empleo',
                    path: '/admin/classifieds',
                    icon: 'classifieds'
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
    },
    methods: {
        isActive(path) {
            return this.currentPath === path || this.currentPath.startsWith(`${path}/`)
        }
    }
}
