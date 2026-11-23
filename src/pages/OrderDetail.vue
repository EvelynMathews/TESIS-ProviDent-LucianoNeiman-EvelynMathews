<script>
/**
 * Propósito: Detalle de una compra para el comprador.
 * Muestra el estado del pedido, cada producto agrupado por vendedor con su estado de envío,
 * cómo se pagó, a dónde se entrega y cómo contactar a cada vendedor para coordinar el envío.
 * Cómo funciona: `getMyOrder` (RPC `get_my_order`) devuelve el pedido solo si es del usuario logueado.
 */
import { getMyOrder, FULFILLMENT_LABELS, ORDER_STATUS_LABELS, formatMoney, formatDate, shortOrderId } from '../services/sales'
import { getProductThumbnails } from '../services/products'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const TYPE_LABELS = { SUPPLY: 'Insumo', PROSTHESIS: 'Prótesis', PLASTER_SERVICE: 'Modelado en yeso', RENTAL: 'Alquiler' }

const PAYMENT_TYPES = {
    account_money: 'Dinero en cuenta de Mercado Pago',
    credit_card: 'Tarjeta de crédito',
    debit_card: 'Tarjeta de débito',
    prepaid_card: 'Tarjeta prepaga',
    ticket: 'Efectivo',
    bank_transfer: 'Transferencia',
}

const PAYMENT_STATUS = {
    APPROVED: 'Aprobado',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazado',
    REFUNDED: 'Devuelto',
    CHARGED_BACK: 'Contracargo',
}

export default {
    name: 'OrderDetail',
    components: { LoadingSpinner },
    data() {
        return {
            order: null,
            thumbs: {},
            loading: true,
            loadError: '',
        }
    },
    computed: {
        orderLabel() {
            return shortOrderId(this.order?.id)
        },
        groups() {
            const map = {}
            for (const item of this.order?.items || []) {
                const key = item.seller?.id || 'x'
                if (!map[key]) map[key] = { seller: item.seller, items: [] }
                map[key].items.push(item)
            }
            return Object.values(map)
        },
        paymentLabel() {
            const p = this.order?.payment
            if (!p) return 'Mercado Pago'
            let label = PAYMENT_TYPES[p.type] || 'Mercado Pago'
            if (p.card_last_four) label += ` terminada en ${p.card_last_four}`
            if (Number(p.installments) > 1) label += ` · ${p.installments} cuotas`
            return label
        },
        itemCount() {
            return (this.order?.items || []).reduce((n, i) => n + (i.quantity || 0), 0)
        }
    },
    methods: {
        formatMoney,
        formatDate,
        typeLabel(type) { return TYPE_LABELS[type] || '' },
        statusLabel(status) { return ORDER_STATUS_LABELS[status] || status },
        paymentStatusLabel(status) { return PAYMENT_STATUS[status] || status },
        fulfillmentLabel(status) { return FULFILLMENT_LABELS[status] || status },
        statusClass(status) {
            if (['DELIVERED', 'COMPLETED'].includes(status)) return 'bg-secondary-50 text-secondary-800'
            if (['PAID', 'SHIPPED', 'FULFILLING'].includes(status)) return 'bg-primary-50 text-primary-800'
            if (status === 'CREATED') return 'bg-amber-100 text-amber-900'
            return 'bg-gray-100 text-gray-700'
        },
        fulfillmentClass(status) {
            if (status === 'DELIVERED') return 'bg-secondary-50 text-secondary-800'
            if (status === 'SHIPPED') return 'bg-primary-50 text-primary-800'
            return 'bg-amber-100 text-amber-900'
        },
        stepState(item, step) {
            const order = ['PENDING', 'SHIPPED', 'DELIVERED']
            const current = order.indexOf(item.fulfillment_status)
            const target = order.indexOf(step)
            return target <= current ? 'done' : 'todo'
        },
        contactLink(group) {
            const subject = encodeURIComponent(`Pedido ${this.orderLabel} en ProviDent`)
            return `mailto:${group.seller.email}?subject=${subject}`
        },
        piecesLabel(item) {
            const opt = item.options
            const n = opt?.teeth?.length || opt?.combinations?.length || 0
            return n ? `${n} ${n === 1 ? 'pieza' : 'piezas'} configuradas` : ''
        },
        async load() {
            this.loading = true
            this.loadError = ''
            try {
                const id = this.$route.params.id
                this.order = /^[0-9a-f-]{36}$/i.test(id) ? await getMyOrder(id) : null
                if (this.order) {
                    document.title = `Compra ${this.orderLabel} · ProviDent`
                    this.thumbs = await getProductThumbnails(this.order.items.map(i => i.product_id))
                }
            } catch (e) {
                this.loadError = e.message
            } finally {
                this.loading = false
            }
        }
    },
    watch: {
        '$route.params.id'() { this.load() }
    },
    mounted() {
        this.load()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-6 pb-16">
        <div class="max-w-6xl mx-auto px-4">
            <nav aria-label="Ruta de navegación" class="mb-4 text-sm">
                <ol class="flex flex-wrap items-center gap-1 text-gray-600">
                    <li><RouterLink to="/mis-compras" class="text-primary-700 font-medium hover:underline">Mis compras</RouterLink></li>
                    <li v-if="order" aria-hidden="true">/</li>
                    <li v-if="order" class="text-gray-700" aria-current="page">Pedido {{ orderLabel }}</li>
                </ol>
            </nav>

            <LoadingSpinner v-if="loading" message="Cargando tu compra..." />

            <div v-else-if="loadError" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
                <p class="text-red-800 font-semibold mb-4">{{ loadError }}</p>
                <button type="button" @click="load" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
            </div>

            <div v-else-if="!order" class="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <h1 class="font-heading text-2xl font-bold text-gray-800 mb-2">No encontramos esta compra</h1>
                <p class="text-gray-600 mb-6">Puede que el enlace sea incorrecto o que la compra sea de otra cuenta.</p>
                <RouterLink to="/mis-compras" class="inline-block px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Ver mis compras</RouterLink>
            </div>

            <template v-else>
                <header class="flex flex-wrap items-start justify-between gap-3 mb-6">
                    <div>
                        <h1 class="font-heading text-3xl font-bold text-gray-800 mb-1">Pedido {{ orderLabel }}</h1>
                        <p class="text-gray-600 m-0">Realizado el {{ formatDate(order.created_at, true) }} · {{ itemCount }} {{ itemCount === 1 ? 'artículo' : 'artículos' }}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-sm font-semibold" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
                </header>

                <div v-if="order.status === 'CREATED'" class="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3" role="status">
                    <p class="m-0 text-sm text-amber-900 flex-1">Este pedido todavía no tiene un pago aprobado.</p>
                    <RouterLink :to="{ path: '/pago/resultado', query: { orden: order.id } }" class="text-sm font-semibold text-amber-900 underline underline-offset-4">Ver estado del pago</RouterLink>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    <div class="lg:col-span-2 space-y-6">
                        <section v-for="group in groups" :key="group.seller?.id" class="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6"
                            :aria-label="`Productos de ${group.seller?.name}`">
                            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <p class="m-0 text-gray-700">
                                    Vendido por
                                    <RouterLink :to="`/usuario/${group.seller.id}`" class="font-semibold text-gray-900 hover:underline">{{ group.seller.name }}</RouterLink>
                                </p>
                                <a v-if="group.seller.email" :href="contactLink(group)"
                                    class="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold border-2 border-primary text-primary rounded-lg hover:bg-primary-50 transition">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Contactar al vendedor
                                </a>
                            </div>

                            <ul class="space-y-5">
                                <li v-for="item in group.items" :key="item.id" class="flex gap-4">
                                    <img :src="thumbs[item.product_id] || '/placeholder-product.svg'" alt="" class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex flex-wrap items-start justify-between gap-2">
                                            <div class="min-w-0">
                                                <p v-if="typeLabel(item.product_type)" class="text-xs font-semibold text-secondary-800 m-0">{{ typeLabel(item.product_type) }}</p>
                                                <RouterLink :to="`/productos/${item.product_id}`" class="font-semibold text-gray-800 hover:underline break-words">{{ item.name }}</RouterLink>
                                                <p class="text-sm text-gray-600 m-0">
                                                    {{ item.quantity }} × {{ formatMoney(item.unit_price) }}
                                                </p>
                                            </div>
                                            <p class="font-bold text-gray-900 tabular-nums m-0">{{ formatMoney(item.subtotal) }}</p>
                                        </div>

                                        <p v-if="item.rental" class="mt-1 text-sm text-gray-700 m-0">
                                            Alquiler del {{ formatDate(item.rental.start_date) }} al {{ formatDate(item.rental.end_date) }} ({{ item.rental.total_days }} {{ item.rental.total_days === 1 ? 'día' : 'días' }})
                                        </p>
                                        <p v-if="item.plaster_description" class="mt-1 text-sm text-gray-700 m-0 line-clamp-3">Tu pedido: {{ item.plaster_description }}</p>
                                        <p v-if="piecesLabel(item)" class="mt-1 text-sm text-gray-700 m-0">{{ piecesLabel(item) }}</p>

                                        <!-- Seguimiento del envío -->
                                        <ol class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" :aria-label="`Estado del envío: ${fulfillmentLabel(item.fulfillment_status)}`">
                                            <li class="track-step track-done">Pagado</li>
                                            <li aria-hidden="true" class="track-sep"></li>
                                            <li class="track-step" :class="stepState(item, 'SHIPPED') === 'done' ? 'track-done' : 'track-todo'">
                                                Enviado<span v-if="item.shipped_at" class="font-normal"> · {{ formatDate(item.shipped_at) }}</span>
                                            </li>
                                            <li aria-hidden="true" class="track-sep"></li>
                                            <li class="track-step" :class="stepState(item, 'DELIVERED') === 'done' ? 'track-done' : 'track-todo'">
                                                Entregado<span v-if="item.delivered_at" class="font-normal"> · {{ formatDate(item.delivered_at) }}</span>
                                            </li>
                                        </ol>
                                    </div>
                                </li>
                            </ul>
                        </section>
                    </div>

                    <aside class="space-y-6 lg:sticky lg:top-24">
                        <section class="bg-white rounded-2xl border border-gray-200 p-6" aria-labelledby="summary-title">
                            <h2 id="summary-title" class="font-heading text-lg font-bold text-gray-800 mb-4">Resumen</h2>
                            <dl class="space-y-3 text-gray-700">
                                <div class="flex justify-between gap-3"><dt>Productos</dt><dd class="m-0 tabular-nums">{{ formatMoney(order.total) }}</dd></div>
                                <div class="flex justify-between gap-3"><dt>Envío</dt><dd class="m-0 text-sm text-gray-600 text-right">A coordinar con el vendedor</dd></div>
                                <div class="flex justify-between gap-3 pt-3 border-t border-gray-200">
                                    <dt class="font-heading font-bold text-gray-800">Total pagado</dt>
                                    <dd class="m-0 font-heading text-xl font-bold text-gray-900 tabular-nums">{{ formatMoney(order.total) }}</dd>
                                </div>
                            </dl>
                        </section>

                        <section class="bg-white rounded-2xl border border-gray-200 p-6" aria-labelledby="payment-title">
                            <h2 id="payment-title" class="font-heading text-lg font-bold text-gray-800 mb-3">Pago</h2>
                            <p class="m-0 text-gray-800">{{ paymentLabel }}</p>
                            <p v-if="order.payment" class="m-0 text-sm text-gray-600">
                                {{ paymentStatusLabel(order.payment.status) }}<template v-if="order.payment.received_at"> el {{ formatDate(order.payment.received_at, true) }}</template>
                            </p>
                            <p v-if="order.payment?.provider_pay_id" class="m-0 mt-1 text-xs text-gray-600 tabular-nums">Operación de Mercado Pago N.° {{ order.payment.provider_pay_id }}</p>
                        </section>

                        <section v-if="order.address" class="bg-white rounded-2xl border border-gray-200 p-6" aria-labelledby="address-title">
                            <h2 id="address-title" class="font-heading text-lg font-bold text-gray-800 mb-3">Entrega</h2>
                            <p class="m-0 font-semibold text-gray-800 break-words">{{ order.address.street }}</p>
                            <p class="m-0 text-sm text-gray-600">{{ [order.address.city, order.address.province, order.address.postal_code ? `CP ${order.address.postal_code}` : ''].filter(Boolean).join(' · ') }}</p>
                            <p v-if="order.address.recipient_name" class="m-0 text-sm text-gray-600">Recibe: {{ order.address.recipient_name }}</p>
                            <p class="mt-3 mb-0 text-sm text-gray-600">Cada vendedor te contacta para acordar el costo y la fecha del envío.</p>
                        </section>

                        <p class="text-sm text-gray-600 m-0">
                            ¿Algún problema con tu compra? <RouterLink to="/soporte" class="font-semibold text-primary-700 underline underline-offset-2">Escribinos</RouterLink>.
                        </p>
                    </aside>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.track-step {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-weight: 600;
}
.track-done {
    background: #E3F7F3;
    color: #114338;
}
.track-todo {
    background: #F3F4F6;
    color: #4B5563;
}
.track-sep {
    width: 1rem;
    height: 2px;
    background: #D1D5DB;
}
</style>
