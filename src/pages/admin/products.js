/**
 * Lógica de la vista de gestión de Productos en el Panel de Administración.
 * Propósito: Permitir a los administradores ver, filtrar, buscar y gestionar
 * todos los productos de todos los vendedores en la plataforma (activar/desactivar, eliminar).
 * Funcionamiento: `loadProducts` obtiene la lista completa de productos junto
 * con información clave de sus subtipos (precio, stock). `applyFilters` implementa
 * el filtrado por búsqueda (`searchQuery`), tipo (`filterType`) y estado (`filterStatus`).
 * `toggleProductStatus` y `deleteProduct` permiten realizar acciones de moderación
 * en el catálogo. Las propiedades calculadas (`productStats`) ofrecen un resumen rápido.
 */

import { supabase } from '../../services/supabase'
import { updateProduct, deleteProductById } from '../../services/products'
import AdminLayout from '../../components/admin/AdminLayout.vue'

export default {
    name: 'AdminProducts',
    components: {
        AdminLayout
    },
    data() {
        return {
            products: [],
            filteredProducts: [],
            searchQuery: '',
            filterType: 'all',
            filterStatus: 'all',
            loading: true,
            showDeleteModal: false,
            productToDelete: null
        }
    },
    computed: {
        productStats() {
            return {
                total: this.products.length,
                active: this.products.filter(p => p.is_active).length,
                inactive: this.products.filter(p => !p.is_active).length
            }
        }
    },
    methods: {
        async loadProducts() {
            try {
                this.loading = true

                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        id,
                        name,
                        description,
                        product_type,
                        is_active,
                        owner_user_id,
                        created_at,
                        supply_products(unit_price, stock_qty, sku),
                        plaster_service_products(base_price),
                        rental_products(stock_qty)
                    `)
                    .order('created_at', { ascending: false })

                if (error) throw error

                this.products = data || []
                this.applyFilters()

            } catch (error) {
                console.error('Error al cargar productos:', error)
            } finally {
                this.loading = false
            }
        },
        applyFilters() {
            let filtered = [...this.products]

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase()
                filtered = filtered.filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    p.description?.toLowerCase().includes(query) ||
                    p.supply_products?.sku?.toLowerCase().includes(query)
                )
            }

            if (this.filterType !== 'all') {
                filtered = filtered.filter(p => p.product_type === this.filterType)
            }

            if (this.filterStatus !== 'all') {
                const isActive = this.filterStatus === 'active'
                filtered = filtered.filter(p => p.is_active === isActive)
            }

            this.filteredProducts = filtered
        },
        async toggleProductStatus(product) {
            try {
                const newStatus = !product.is_active
                await updateProduct(product.id, { is_active: newStatus })
                product.is_active = newStatus
                this.applyFilters()
            } catch (error) {
                console.error('Error al cambiar estado:', error)
                alert('Error al cambiar el estado del producto')
            }
        },
        confirmDelete(product) {
            this.productToDelete = product
            this.showDeleteModal = true
        },
        cancelDelete() {
            this.productToDelete = null
            this.showDeleteModal = false
        },
        async deleteProduct() {
            if (!this.productToDelete) return

            try {
                await deleteProductById(this.productToDelete.id)
                this.products = this.products.filter(p => p.id !== this.productToDelete.id)
                this.applyFilters()
                this.cancelDelete()
            } catch (error) {
                console.error('Error al eliminar producto:', error)
                alert('Error al eliminar el producto')
            }
        },
        getProductTypeName(type) {
            const types = {
                'SUPPLY': 'Insumo',
                'PROSTHESIS': 'Prótesis',
                'PLASTER_SERVICE': 'Servicio de Yeso',
                'RENTAL': 'Alquiler'
            }
            return types[type] || type
        },
        getProductPrice(product) {
            if (product.supply_products?.unit_price) {
                return `$${product.supply_products.unit_price}`
            }
            if (product.plaster_service_products?.base_price) {
                return `$${product.plaster_service_products.base_price}`
            }
            return '-'
        },
        getProductStock(product) {
            if (product.supply_products?.stock_qty !== undefined) {
                return product.supply_products.stock_qty
            }
            if (product.rental_products?.stock_qty !== undefined) {
                return product.rental_products.stock_qty
            }
            return '-'
        },
        formatDate(dateString) {
            const date = new Date(dateString)
            return date.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }
    },
    watch: {
        searchQuery() {
            this.applyFilters()
        },
        filterType() {
            this.applyFilters()
        },
        filterStatus() {
            this.applyFilters()
        }
    },
    mounted() {
        this.loadProducts()
    }
}
