<script>
/**
 * Propósito: "Mis ventas" del vendedor. Lista lo vendido y pagado, con los datos del comprador
 * para coordinar el envío, el avance de cada envío y cuánto le corresponde cobrar.
 * Cómo funciona:
 *  - `getSellerSales` (RPC) trae una fila por producto vendido; acá se agrupan por pedido.
 *  - El vendedor avanza el envío: Pendiente -> Enviado -> Entregado (`updateFulfillment`).
 *    Al marcar "Entregado", su parte (neto, ya descontado el 5% de comisión) queda lista para que
 *    ProviDent se la transfiera a la cuenta cargada en sus datos de cobro.
 */
import { getSellerSales, updateFulfillment, FULFILLMENT_LABELS, formatMoney, formatDate, shortOrderId } from '../services/sales'
import { getPayoutInfo } from '../services/sellers'
import { getProductThumbnails } from '../services/products'
import { showToast } from '../services/toast'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PayoutInfoForm from '../components/PayoutInfoForm.vue'

const TYPE_LABELS = { SUPPLY: 'Insumo', PROSTHESIS: 'Prótesis', PLASTER_SERVICE: 'Modelado en yeso', RENTAL: 'Alquiler' }

const FILTERS = [
    { value: 'PENDING', label: 'Para enviar' },
    { value: 'SHIPPED', label: 'Enviadas' },
    { value: 'DELIVERED', label: 'Entregadas' },
    { value: 'ALL', label: 'Todas' },
]

export default {
    name: 'MySales',
    components: { LoadingSpinner, ConfirmModal, PayoutInfoForm },
    data() {
        return {
            sales: [],
            thumbs: {},
            payoutInfo: null,
            showPayoutForm: false,
            loading: true,
            loadError: '',
            filter: 'PENDING',
            filters: FILTERS,
            pendingAction: null, // { item, status }
            saving: false,
        }
    },
    computed: {
        counts() {
            const c = { PENDING: 0, SHIPPED: 0, DELIVERED: 0, ALL: this.sales.length }
            for (const s of this.sales) c[s.fulfillment_status] = (c[s.fulfillment_status] || 0) + 1
            return c
        },
        totals() {
            const t = { toCollect: 0, held: 0, paid: 0 }
            for (const s of this.sales) {
                const net = Number(s.net) || 0
                if (s.paid_out_at) t.paid += net
                else if (s.escrow_status === 'RELEASED') t.toCollect += net
                else if (s.escrow_status === 'HELD') t.held += net
            }
            return t
        },
        orders() {
            const list = this.filter === 'ALL' ? this.sales : this.sales.filter(s => s.fulfillment_status === this.filter)
            const map = {}
            for (const s of list) {
                if (!map[s.order_id]) map[s.order_id] = { id: s.order_id, created_at: s.created_at, buyer: s.buyer, address: s.address, items: [] }
                map[s.order_id].items.push(s)
            }
            return Object.values(map).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        },
        emptyMessage() {
            if (!this.sales.length) return 'Todavía no vendiste nada. Cuando un comprador pague una de tus publicaciones, la vas a ver acá.'
            return {
                PENDING: 'No tenés ventas pendientes de envío.',
                SHIPPED: 'No tenés ventas en camino.',
                DELIVERED: 'Todavía no marcaste ventas como entregadas.',
            }[this.filter] || 'No hay ventas para mostrar.'
        },
        confirmCopy() {
            if (!this.pendingAction) return {}
            const name = this.pendingAction.item.product_name
            return this.pendingAction.status === 'SHIPPED'
                ? { title: 'Marcar como enviado', message: `¿Ya despachaste “${name}”? El comprador va a ver que está en camino.`, confirm: 'Sí, lo envié' }
                : { title: 'Marcar como entregado', message: `¿El comprador ya recibió “${name}”? Al confirmarlo, tu parte queda lista para que te la transfiramos.`, confirm: 'Sí, fue entregado' }
        }
    },
    methods: {
        formatMoney,
        formatDate,
        shortOrderId,
        typeLabel(type) { return TYPE_LABELS[type] || '' },
        fulfillmentLabel(status) { return FULFILLMENT_LABELS[status] || status },
        fulfillmentClass(status) {
            if (status === 'DELIVERED') return 'bg-secondary-50 text-secondary-800'
            if (status === 'SHIPPED') return 'bg-primary-50 text-primary-800'
            return 'bg-amber-100 text-amber-900'
        },
        payoutStatus(item) {
            if (item.paid_out_at) return { label: `Transferido el ${formatDate(item.paid_out_at)}`, cls: 'text-secondary-800' }
            if (item.escrow_status === 'RELEASED') return { label: 'Listo para transferir', cls: 'text-primary-800' }
            if (item.escrow_status === 'REFUNDED') return { label: 'Devuelto al comprador', cls: 'text-gray-600' }
            return { label: 'Se libera al marcarlo entregado', cls: 'text-gray-600' }
        },
        piecesLabel(item) {
            const n = item.options?.teeth?.length || item.options?.combinations?.length || 0
            return n ? `${n} ${n === 1 ? 'pieza' : 'piezas'} configuradas` : ''
        },
        mailto(order) {
            const subject = encodeURIComponent(`Tu compra ${shortOrderId(order.id)} en ProviDent`)
            return `mailto:${order.buyer.email}?subject=${subject}`
        },
        askUpdate(item, status) {
            this.pendingAction = { item, status }
        },
        async confirmUpdate() {
            const { item, status } = this.pendingAction
            this.saving = true
            try {
                await updateFulfillment(item.order_item_id, status)
                const fresh = this.sales.find(s => s.order_item_id === item.order_item_id)
                if (fresh) {
                    fresh.fulfillment_status = status
                    if (!fresh.shipped_at) fresh.shipped_at = new Date().toISOString()
                    if (status === 'DELIVERED') {
                        fresh.delivered_at = new Date().toISOString()
                        if (fresh.escrow_status === 'HELD') fresh.escrow_status = 'RELEASED'
                    }
                }
                showToast(status === 'SHIPPED' ? 'Venta marcada como enviada' : 'Venta entregada: tu parte quedó lista para transferir')
                this.pendingAction = null
            } catch (e) {
                showToast(e.message, 'error', 5000)
            } finally {
                this.saving = false
            }
        },
        onPayoutSaved(info) {
            this.payoutInfo = info
            this.showPayoutForm = false
            showToast('Datos de cobro guardados')
        },
        async load() {
            this.loading = true
            this.loadError = ''
            try {
                const [sales, payoutInfo] = await Promise.all([getSellerSales(), getPayoutInfo()])
                this.sales = sales
                this.payoutInfo = payoutInfo
                if (!sales.some(s => s.fulfillment_status === 'PENDING') && sales.length) this.filter = 'ALL'
                this.thumbs = await getProductThumbnails(sales.map(s => s.product_id))
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
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                    <h1 class="font-heading text-3xl font-bold text-gray-800 mb-1">Mis ventas</h1>
                    <p class="text-gray-600 m-0">Coordiná los envíos y seguí lo que te corresponde cobrar.</p>
                </div>
                <RouterLink to="/mis-productos" class="text-sm font-semibold text-primary-700 hover:underline">Ver mis publicaciones</RouterLink>
            </div>

            <LoadingSpinner v-if="loading" message="Cargando tus ventas..." />

            <div v-else-if="loadError" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
                <p class="text-red-800 font-semibold mb-4">{{ loadError }}</p>
                <button type="button" @click="load" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
            </div>

            <template v-else>
                <!-- Datos de cobro -->
                <section v-if="!payoutInfo || showPayoutForm" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="payout-title">
                    <h2 id="payout-title" class="font-heading text-lg font-bold text-gray-800 mb-1">{{ payoutInfo ? 'Modificar datos de cobro' : 'Cargá tus datos de cobro' }}</h2>
                    <p class="text-sm text-gray-700 mb-4">Sin un CBU, CVU o alias no podemos transferirte el dinero de tus ventas.</p>
                    <div class="bg-white rounded-xl p-4 sm:p-5">
                        <PayoutInfoForm id-prefix="sales-payout" :initial="payoutInfo" @saved="onPayoutSaved" @cancel="showPayoutForm = false" />
                    </div>
                </section>

                <!-- Resumen de dinero -->
                <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" aria-label="Resumen de cobros">
                    <div class="bg-white rounded-2xl border border-gray-200 p-5">
                        <h2 class="text-sm font-normal font-sans text-gray-600 m-0">Para cobrar</h2>
                        <p class="m-0 font-heading text-2xl font-bold text-gray-900 tabular-nums">{{ formatMoney(totals.toCollect) }}</p>
                        <p class="m-0 mt-1 text-xs text-gray-600">Ventas entregadas que te vamos a transferir.</p>
                    </div>
                    <div class="bg-white rounded-2xl border border-gray-200 p-5">
                        <h2 class="text-sm font-normal font-sans text-gray-600 m-0">Retenido hasta la entrega</h2>
                        <p class="m-0 font-heading text-2xl font-bold text-gray-900 tabular-nums">{{ formatMoney(totals.held) }}</p>
                        <p class="m-0 mt-1 text-xs text-gray-600">Se libera cuando marcás la venta como entregada.</p>
                    </div>
                    <div class="bg-white rounded-2xl border border-gray-200 p-5">
                        <h2 class="text-sm font-normal font-sans text-gray-600 m-0">Ya transferido</h2>
                        <p class="m-0 font-heading text-2xl font-bold text-gray-900 tabular-nums">{{ formatMoney(totals.paid) }}</p>
                        <p v-if="payoutInfo && !showPayoutForm" class="m-0 mt-1 text-xs text-gray-600">
                            A {{ payoutInfo.alias || ('CBU •••• ' + String(payoutInfo.cbu_cvu || '').slice(-4)) }} ·
                            <button type="button" class="font-semibold text-primary-700 underline underline-offset-2" @click="showPayoutForm = true">Cambiar</button>
                        </p>
                    </div>
                </section>

                <!-- Filtros -->
                <div class="mb-5 -mx-4 px-4 overflow-x-auto" role="group" aria-label="Filtrar ventas por estado de envío">
                    <div class="flex gap-2 w-max">
                        <button v-for="f in filters" :key="f.value" type="button" @click="filter = f.value" :aria-pressed="filter === f.value"
                            class="h-10 px-4 rounded-full text-sm font-medium border transition whitespace-nowrap"
                            :class="filter === f.value ? 'bg-primary-700 border-primary-700 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-primary-50'">
                            {{ f.label }} <span class="tabular-nums" :class="filter === f.value ? 'text-primary-100' : 'text-gray-500'">{{ counts[f.value] || 0 }}</span>
                        </button>
                    </div>
                </div>

                <p v-if="!orders.length" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
                    {{ emptyMessage }}
                </p>

                <ul v-else class="space-y-5">
                    <li v-for="order in orders" :key="order.id" class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <!-- Comprador y entrega -->
                        <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 p-5 border-b border-gray-100 bg-gray-50/60">
                            <div class="min-w-0">
                                <p class="m-0 text-sm text-gray-600">Pedido {{ shortOrderId(order.id) }} · {{ formatDate(order.created_at, true) }}</p>
                                <p class="m-0 font-semibold text-gray-900">{{ order.buyer?.name }}</p>
                                <p v-if="order.address" class="m-0 text-sm text-gray-700 break-words">
                                    {{ order.address.street }} · {{ [order.address.city, order.address.province, order.address.postal_code ? `CP ${order.address.postal_code}` : ''].filter(Boolean).join(' · ') }}
                                    <template v-if="order.address.recipient_name"> · Recibe {{ order.address.recipient_name }}</template>
                                </p>
                            </div>
                            <a v-if="order.buyer?.email" :href="mailto(order)"
                                class="self-start inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold border-2 border-primary text-primary rounded-lg hover:bg-primary-50 transition whitespace-nowrap">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Coordinar envío
                            </a>
                        </div>

                        <!-- Productos -->
                        <ul class="divide-y divide-gray-100">
                            <li v-for="item in order.items" :key="item.order_item_id" class="p-5 grid grid-cols-1 lg:grid-cols-[1fr_15rem] gap-4">
                                <div class="flex gap-4 min-w-0">
                                    <img :src="thumbs[item.product_id] || '/placeholder-product.svg'" alt="" class="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                    <div class="min-w-0">
                                        <p v-if="typeLabel(item.product_type)" class="text-xs font-semibold text-secondary-800 m-0">{{ typeLabel(item.product_type) }}</p>
                                        <p class="m-0 font-semibold text-gray-800 break-words">{{ item.product_name }}</p>
                                        <p class="m-0 text-sm text-gray-600">{{ item.quantity }} × {{ formatMoney(item.unit_price) }}</p>
                                        <p v-if="item.rental" class="m-0 text-sm text-gray-700">Del {{ formatDate(item.rental.start_date) }} al {{ formatDate(item.rental.end_date) }}</p>
                                        <p v-if="item.plaster_description" class="m-0 text-sm text-gray-700 line-clamp-3">Pedido: {{ item.plaster_description }}</p>
                                        <p v-if="piecesLabel(item)" class="m-0 text-sm text-gray-700">{{ piecesLabel(item) }}</p>
                                        <p class="mt-2 mb-0 flex flex-wrap items-center gap-2">
                                            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full" :class="fulfillmentClass(item.fulfillment_status)">{{ fulfillmentLabel(item.fulfillment_status) }}</span>
                                            <span v-if="item.delivered_at" class="text-xs text-gray-600">el {{ formatDate(item.delivered_at) }}</span>
                                            <span v-else-if="item.shipped_at" class="text-xs text-gray-600">el {{ formatDate(item.shipped_at) }}</span>
                                        </p>
                                    </div>
                                </div>

                                <div class="lg:border-l lg:border-gray-100 lg:pl-5 flex flex-col gap-3">
                                    <dl class="text-sm space-y-1">
                                        <div class="flex justify-between gap-3"><dt class="text-gray-600">Venta</dt><dd class="m-0 tabular-nums text-gray-800">{{ formatMoney(item.gross ?? item.subtotal) }}</dd></div>
                                        <div class="flex justify-between gap-3"><dt class="text-gray-600">Comisión 5%</dt><dd class="m-0 tabular-nums text-gray-800">− {{ formatMoney(item.fee) }}</dd></div>
                                        <div class="flex justify-between gap-3 pt-1 border-t border-gray-100"><dt class="font-semibold text-gray-800">Te queda</dt><dd class="m-0 font-bold tabular-nums text-gray-900">{{ formatMoney(item.net) }}</dd></div>
                                    </dl>
                                    <p class="m-0 text-xs font-medium" :class="payoutStatus(item).cls">{{ payoutStatus(item).label }}</p>
                                    <button v-if="item.fulfillment_status === 'PENDING'" type="button" @click="askUpdate(item, 'SHIPPED')"
                                        class="h-10 px-4 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-600 transition">
                                        Marcar como enviado
                                    </button>
                                    <button v-else-if="item.fulfillment_status === 'SHIPPED'" type="button" @click="askUpdate(item, 'DELIVERED')"
                                        class="h-10 px-4 text-sm font-semibold text-white bg-secondary-700 rounded-lg hover:bg-secondary-800 transition">
                                        Marcar como entregado
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </template>
        </div>

        <ConfirmModal v-if="pendingAction"
            :title="confirmCopy.title"
            :message="confirmCopy.message"
            :confirm-text="confirmCopy.confirm"
            :danger="false"
            :loading="saving"
            @confirm="confirmUpdate"
            @cancel="pendingAction = null" />
    </div>
</template>
