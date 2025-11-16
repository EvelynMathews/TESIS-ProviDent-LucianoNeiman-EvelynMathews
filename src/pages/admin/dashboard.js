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
            loading: true
        }
    },
    methods: {
        async loadDashboardData() {
            try {
                this.loading = true

                const [productsRes, usersRes, activeProductsRes, recentProductsRes] = await Promise.all([
                    supabase.from('products').select('id', { count: 'exact', head: true }),
                    supabase.from('public_user_profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
                    supabase
                        .from('products')
                        .select('id, name, product_type, is_active, created_at, supply_products(stock_qty)')
                        .order('created_at', { ascending: false })
                        .limit(5)
                ])

                this.stats.totalProducts = productsRes.count || 0
                this.stats.totalUsers = usersRes.count || 0
                this.stats.activeProducts = activeProductsRes.count || 0
                this.recentProducts = recentProductsRes.data || []

            } catch (error) {
                console.error('Error al cargar datos del dashboard:', error)
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
