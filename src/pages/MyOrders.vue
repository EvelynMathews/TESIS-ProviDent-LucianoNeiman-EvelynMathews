<script>
/**
 * Propósito: Listado de todas las compras del usuario, con acceso al detalle de cada una.
 * Cómo funciona: `listMyPurchases` trae los pedidos del comprador (oculta checkouts abandonados).
 */
import { listMyPurchases, ORDER_STATUS_LABELS, formatMoney, formatDate, shortOrderId } from '../services/sales'
import LoadingSpinner from '../components/LoadingSpinner.vue'

export default {
    name: 'MyOrders',
    components: { LoadingSpinner },
    data() {
        return { orders: [], loading: true, loadError: '' }
    },
    methods: {
        formatMoney,
        formatDate,
        shortOrderId,
        statusLabel(status) { return ORDER_STATUS_LABELS[status] || status },
        statusClass(status) {
            if (['DELIVERED', 'COMPLETED'].includes(status)) return 'bg-secondary-50 text-secondary-800'
            if (['PAID', 'SHIPPED', 'FULFILLING'].includes(status)) return 'bg-primary-50 text-primary-800'
            if (status === 'CREATED') return 'bg-amber-100 text-amber-900'
            return 'bg-gray-100 text-gray-700'
        },
        summary(order) {
            const names = order.names || []
            if (!names.length) return `${order.items_count} ${order.items_count === 1 ? 'artículo' : 'artículos'}`
            return names.length > 2 ? `${names.slice(0, 2).join(', ')} y ${names.length - 2} más` : names.join(', ')
        },
        async load() {
            this.loading = true
            this.loadError = ''
            try {
                this.orders = await listMyPurchases()
            } catch (e) {
                this.loadError = e.message
            } finally {
                this.loading = false
            }
        }
    },
    mounted() {
        this.load()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-8 pb-16">
        <div class="max-w-4xl mx-auto px-4">
            <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">Mis compras</h1>

            <LoadingSpinner v-if="loading" message="Cargando tus compras..." />

            <div v-else-if="loadError" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
                <p class="text-red-800 font-semibold mb-4">{{ loadError }}</p>
                <button type="button" @click="load" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
            </div>

            <div v-else-if="!orders.length" class="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">Todavía no hiciste compras</h2>
                <p class="text-gray-600 mb-6">Cuando pagues un pedido lo vas a ver acá, con el seguimiento de cada envío.</p>
                <RouterLink to="/productos" class="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">Ver catálogo</RouterLink>
            </div>

            <ul v-else class="space-y-3">
                <li v-for="order in orders" :key="order.id">
                    <RouterLink :to="order.status === 'CREATED' ? { path: '/pago/resultado', query: { orden: order.id } } : `/mis-compras/${order.id}`"
                        class="group flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-primary-300 hover:shadow-[0_8px_24px_-14px_rgba(18,45,70,0.35)] transition">
                        <div class="flex-1 min-w-0">
                            <p class="m-0 font-semibold text-gray-800">
                                Pedido {{ shortOrderId(order.id) }}
                                <span class="font-normal text-gray-600">· {{ formatDate(order.created_at) }}</span>
                            </p>
                            <p class="m-0 text-sm text-gray-600 truncate">{{ summary(order) }}</p>
                        </div>
                        <span class="px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
                        <span class="font-bold text-gray-900 tabular-nums whitespace-nowrap">{{ formatMoney(order.total_amount) }}</span>
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </RouterLink>
                </li>
            </ul>
        </div>
    </div>
</template>
