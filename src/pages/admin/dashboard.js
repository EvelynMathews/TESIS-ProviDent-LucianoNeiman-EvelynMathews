/**
 * Lógica de la vista principal del Panel de Administración (Dashboard).
 * Propósito: Obtener y mostrar un resumen de las métricas clave de la plataforma
 * y una lista de los productos más recientes.
 * Funcionamiento: El método `loadDashboardData` realiza varias consultas asíncronas
 * a la base de datos (Supabase) en paralelo (`Promise.all`) para obtener:
 * 1. Conteo total de productos.
 * 2. Conteo total de usuarios.
 * 3. Conteo de productos activos.
 * 4. Los 5 productos más recientes.
 * Las funciones `formatDate` y `getProductTypeName` ayudan a presentar los datos de forma legible.
 */

import { supabase } from '../../services/supabase'
import AdminLayout from '../../components/admin/AdminLayout.vue'

export default {
    name: 'AdminDashboard',
    components: {
        AdminLayout
    },
    data() {
        return {
            stats: {
                totalProducts: 0,
                totalUsers: 0,
                activeProducts: 0
            },
            recentProducts: [],
            loading: true,
            errorMessage: ''
        }
    },
    methods: {
        async loadDashboardData() {
            try {
                this.loading = true

                this.errorMessage = ''

                const results = await Promise.all([
                    supabase.from('products').select('id', { count: 'exact', head: true }),
                    supabase.from('users').select('id', { count: 'exact', head: true }),
                    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
                    supabase
                        .from('products')
                        .select('id, name, product_type, is_active, created_at, supply_products(stock_qty)')
                        .order('created_at', { ascending: false })
                        .limit(5)
                ])

                const failed = results.find(res => res.error)
                if (failed) throw failed.error

                const [productsRes, usersRes, activeProductsRes, recentProductsRes] = results

                this.stats.totalProducts = productsRes.count || 0
                this.stats.totalUsers = usersRes.count || 0
                this.stats.activeProducts = activeProductsRes.count || 0
                this.recentProducts = recentProductsRes.data || []

            } catch (error) {
                console.error('Error al cargar datos del dashboard:', error)
                this.errorMessage = 'No se pudieron cargar los datos del panel. Intentá de nuevo más tarde.'
            } finally {
                this.loading = false
            }
        },
        formatDate(dateString) {
            const date = new Date(dateString)
            return date.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        getProductTypeName(type) {
            const types = {
                'SUPPLY': 'Insumo',
                'PROSTHESIS': 'Prótesis',
                'PLASTER_SERVICE': 'Servicio de Yeso',
                'RENTAL': 'Alquiler'
            }
            return types[type] || type
        }
    },
    mounted() {
        this.loadDashboardData()
    }
}
