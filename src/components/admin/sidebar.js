/**
 * Este archivo contiene la lógica (JavaScript) de la barra de navegación lateral (Sidebar) del panel de administración.
 * Propósito: Definir los enlaces de navegación disponibles para el administrador.
 * Funcionamiento: Expone una lista fija de `menuItems` (ruta, nombre, ícono)
 * que se iteran en el template. La propiedad computada `currentPath` se utiliza
 * para identificar la ruta activa y aplicar el estilo correspondiente.
 */

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
