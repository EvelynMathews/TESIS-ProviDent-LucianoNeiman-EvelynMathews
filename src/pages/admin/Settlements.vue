<script>
/**
 * Propósito: Liquidaciones a vendedores (panel admin).
 * Muestra, por vendedor, cuánto se le debe (ventas ya entregadas, neto de la comisión del 5%),
 * sus datos bancarios para transferirle y permite registrar la transferencia hecha.
 * Cómo funciona: `getSettlements` (RPC `admin_get_settlements`) y `markPayouts`
 * (RPC `admin_mark_payouts`, crea filas en `payouts`). Ambas validan que quien llama sea admin.
 */
import AdminLayout from '../../components/admin/AdminLayout.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'
import { getSettlements, markPayouts, formatMoney, formatDate, shortOrderId } from '../../services/sales'
import { showToast } from '../../services/toast'

export default {
    name: 'AdminSettlements',
    components: { AdminLayout, ConfirmModal },
    data() {
        return {
            sellers: [],
            selected: {}, // { [sellerId]: Set-like objeto { [splitId]: true } }
            references: {},
            loading: true,
            loadError: '',
            toConfirm: null, // seller
            saving: false,
        }
    },
    computed: {
        pendingSellers() {
            return this.sellers.filter(s => Number(s.pending_total) > 0)
        },
        otherSellers() {
            return this.sellers.filter(s => !(Number(s.pending_total) > 0))
        },
        totals() {
            return this.sellers.reduce((t, s) => ({
                pending: t.pending + Number(s.pending_total || 0),
                held: t.held + Number(s.held_total || 0),
                paid: t.paid + Number(s.paid_total || 0),
            }), { pending: 0, held: 0, paid: 0 })
        }
    },
    methods: {
        formatMoney,
        formatDate,
        shortOrderId,
        account(seller) {
            return seller.payout_info?.account || null
        },
        selectedIds(seller) {
            const sel = this.selected[seller.seller_id] || {}
            return seller.pending_items.filter(i => sel[i.split_id]).map(i => i.split_id)
        },
        selectedTotal(seller) {
            const ids = new Set(this.selectedIds(seller))
            return seller.pending_items.filter(i => ids.has(i.split_id)).reduce((n, i) => n + Number(i.net || 0), 0)
        },
        toggle(seller, splitId, value) {
            this.selected[seller.seller_id] = { ...(this.selected[seller.seller_id] || {}), [splitId]: value }
        },
        allSelected(seller) {
            return this.selectedIds(seller).length === seller.pending_items.length
        },
        toggleAll(seller, value) {
            this.selected[seller.seller_id] = Object.fromEntries(seller.pending_items.map(i => [i.split_id, value]))
        },
        async copy(text, label) {
            try {
                await navigator.clipboard.writeText(text)
                showToast(`${label} copiado`)
            } catch {
                showToast('No se pudo copiar. Seleccionalo y copialo a mano.', 'error')
            }
        },
        async confirmPayout() {
            const seller = this.toConfirm
            this.saving = true
            try {
                const res = await markPayouts(this.selectedIds(seller), this.references[seller.seller_id] || '')
                showToast(`Transferencia registrada: ${res.count} ${res.count === 1 ? 'venta' : 'ventas'} por ${formatMoney(res.total)}`)
                this.toConfirm = null
                this.references[seller.seller_id] = ''
                await this.load()
            } catch (e) {
                showToast(e.message, 'error', 5000)
            } finally {
                this.saving = false
            }
        },
        async load() {
            this.loading = true
            this.loadError = ''
            try {
                this.sellers = await getSettlements()
                this.selected = Object.fromEntries(this.sellers.map(s => [s.seller_id, Object.fromEntries((s.pending_items || []).map(i => [i.split_id, true]))]))
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
    <AdminLayout>
        <div class="page-header">
            <div>
                <h1 class="page-title">Liquidaciones</h1>
                <p class="page-subtitle">Transferí a cada vendedor lo de sus ventas entregadas (ya descontada la comisión del 5%).</p>
            </div>
        </div>

        <div v-if="loading" class="py-10 text-center text-gray-600" role="status">Cargando liquidaciones...</div>

        <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800" role="alert">
            <p class="font-semibold m-0">{{ loadError }}</p>
            <button type="button" @click="load" class="mt-3 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
        </div>

        <template v-else>
            <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" aria-label="Totales">
                <div class="stat">
                    <h2 class="stat-label">A transferir</h2>
                    <p class="stat-value">{{ formatMoney(totals.pending) }}</p>
                </div>
                <div class="stat">
                    <h2 class="stat-label">Retenido (envíos sin entregar)</h2>
                    <p class="stat-value">{{ formatMoney(totals.held) }}</p>
                </div>
                <div class="stat">
                    <h2 class="stat-label">Ya transferido</h2>
                    <p class="stat-value">{{ formatMoney(totals.paid) }}</p>
                </div>
            </section>

            <p v-if="!pendingSellers.length" class="rounded-xl border-2 border-primary-50 bg-white p-8 text-center text-gray-600">
                No hay transferencias pendientes. Cuando un vendedor marque una venta como entregada, aparece acá.
            </p>

            <section v-for="seller in pendingSellers" :key="seller.seller_id" class="seller-card" :aria-labelledby="`seller-${seller.seller_id}`">
                <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h2 :id="`seller-${seller.seller_id}`" class="text-xl font-bold text-gray-900 m-0">{{ seller.name }}</h2>
                        <a :href="`mailto:${seller.email}`" class="text-sm text-primary-700 hover:underline">{{ seller.email }}</a>
                    </div>
                    <p class="m-0 text-right">
                        <span class="block text-sm text-gray-600">Le debemos</span>
                        <span class="text-2xl font-bold text-gray-900 tabular-nums">{{ formatMoney(seller.pending_total) }}</span>
                    </p>
                </div>

                <!-- Datos bancarios -->
                <div v-if="account(seller)" class="rounded-xl bg-gray-50 p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                        <p class="m-0 text-gray-600">Titular</p>
                        <p class="m-0 font-semibold text-gray-900">{{ account(seller).holder_name }}</p>
                        <p v-if="account(seller).cuit" class="m-0 text-gray-600 tabular-nums">CUIT/CUIL {{ account(seller).cuit }}</p>
                    </div>
                    <div v-if="account(seller).cbu_cvu">
                        <p class="m-0 text-gray-600">CBU/CVU</p>
                        <p class="m-0 flex items-center gap-2">
                            <span class="font-semibold text-gray-900 tabular-nums break-all">{{ account(seller).cbu_cvu }}</span>
                            <button type="button" class="copy-btn" @click="copy(account(seller).cbu_cvu, 'CBU/CVU')" :aria-label="`Copiar CBU de ${seller.name}`">Copiar</button>
                        </p>
                    </div>
                    <div v-if="account(seller).alias">
                        <p class="m-0 text-gray-600">Alias</p>
                        <p class="m-0 flex items-center gap-2">
                            <span class="font-semibold text-gray-900 break-all">{{ account(seller).alias }}</span>
                            <button type="button" class="copy-btn" @click="copy(account(seller).alias, 'Alias')" :aria-label="`Copiar alias de ${seller.name}`">Copiar</button>
                        </p>
                    </div>
                </div>
                <p v-else class="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-900" role="status">
                    Este vendedor todavía no cargó sus datos de cobro. Escribile para que los complete en “Mis ventas”.
                </p>

                <!-- Ventas a liquidar -->
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <caption class="sr-only">Ventas entregadas pendientes de transferir a {{ seller.name }}</caption>
                        <thead class="text-left text-gray-600 border-b border-gray-200">
                            <tr>
                                <th scope="col" class="py-2 pr-2 w-10">
                                    <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary" :checked="allSelected(seller)"
                                        @change="toggleAll(seller, $event.target.checked)" :aria-label="`Seleccionar todas las ventas de ${seller.name}`" />
                                </th>
                                <th scope="col" class="py-2 px-2 font-semibold">Pedido</th>
                                <th scope="col" class="py-2 px-2 font-semibold">Producto</th>
                                <th scope="col" class="py-2 px-2 font-semibold">Entregado</th>
                                <th scope="col" class="py-2 px-2 font-semibold text-right">Venta</th>
                                <th scope="col" class="py-2 px-2 font-semibold text-right">Comisión</th>
                                <th scope="col" class="py-2 pl-2 font-semibold text-right">A transferir</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in seller.pending_items" :key="item.split_id" class="border-b border-gray-100">
                                <td class="py-3 pr-2">
                                    <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary"
                                        :checked="!!(selected[seller.seller_id] || {})[item.split_id]"
                                        @change="toggle(seller, item.split_id, $event.target.checked)"
                                        :aria-label="`Incluir ${item.product_name} del pedido ${shortOrderId(item.order_id)}`" />
                                </td>
                                <td class="py-3 px-2 tabular-nums whitespace-nowrap">{{ shortOrderId(item.order_id) }}</td>
                                <td class="py-3 px-2 text-gray-800">{{ item.product_name }} <span class="text-gray-500">× {{ item.quantity }}</span></td>
                                <td class="py-3 px-2 whitespace-nowrap">{{ formatDate(item.delivered_at) }}</td>
                                <td class="py-3 px-2 text-right tabular-nums">{{ formatMoney(item.gross) }}</td>
                                <td class="py-3 px-2 text-right tabular-nums text-gray-600">− {{ formatMoney(item.fee) }}</td>
                                <td class="py-3 pl-2 text-right tabular-nums font-semibold text-gray-900">{{ formatMoney(item.net) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 flex flex-col md:flex-row md:items-end gap-3">
                    <div class="flex-1">
                        <label :for="`ref-${seller.seller_id}`" class="block text-sm font-medium text-gray-700 mb-1">Referencia de la transferencia <span class="font-normal text-gray-500">(opcional)</span></label>
                        <input :id="`ref-${seller.seller_id}`" v-model="references[seller.seller_id]" type="text" placeholder="Ej: N.° de operación del banco"
                            class="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <button type="button" :disabled="!selectedIds(seller).length" @click="toConfirm = seller"
                        class="h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        Marcar {{ formatMoney(selectedTotal(seller)) }} como transferido
                    </button>
                </div>
            </section>

            <details v-if="otherSellers.length" class="mt-8 rounded-xl border-2 border-primary-50 bg-white p-5">
                <summary class="cursor-pointer font-semibold text-gray-800">Vendedores sin transferencias pendientes ({{ otherSellers.length }})</summary>
                <ul class="mt-4 divide-y divide-gray-100 text-sm">
                    <li v-for="s in otherSellers" :key="s.seller_id" class="py-3 flex flex-wrap justify-between gap-2">
                        <span class="font-medium text-gray-800">{{ s.name }}</span>
                        <span class="text-gray-600 tabular-nums">Retenido {{ formatMoney(s.held_total) }} · Transferido {{ formatMoney(s.paid_total) }}</span>
                    </li>
                </ul>
            </details>
        </template>

        <ConfirmModal v-if="toConfirm"
            title="Registrar transferencia"
            :message="`¿Ya transferiste ${formatMoney(selectedTotal(toConfirm))} a ${toConfirm.name}? Se va a registrar como pagado y el vendedor lo verá en Mis ventas.`"
            confirm-text="Sí, ya transferí"
            :danger="false"
            :loading="saving"
            @confirm="confirmPayout"
            @cancel="toConfirm = null" />
    </AdminLayout>
</template>

<style scoped>
.page-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
}

.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #2A6FAF;
    margin-bottom: 0.5rem;
}

.page-subtitle {
    color: #4B5563;
    font-size: 1rem;
}

.stat {
    background: white;
    border: 2px solid #E3EEF8;
    border-radius: 0.75rem;
    padding: 1.25rem;
}

.stat-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #4B5563;
    margin: 0 0 0.25rem;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    font-variant-numeric: tabular-nums;
}

.seller-card {
    background: white;
    border: 2px solid #E3EEF8;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.copy-btn {
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid #8FBBE3;
    color: #1A4369;
    font-size: 0.75rem;
    font-weight: 600;
}

.copy-btn:hover {
    background: #E3EEF8;
}
</style>
