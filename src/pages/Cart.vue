<script>
/**
 * Vista del carrito de compras del usuario.
 * Propósito: Mostrar los productos y servicios que el usuario agregó, permitir cambiar
 * cantidades (solo insumos), quitar artículos y ver el total del pedido.
 * Funcionamiento: Usa el servicio `cart.js` (sincronizado con Supabase) para leer los ítems
 * (`cartItems`) y modificarlos. Sin sesión el carrito se guarda en el navegador; para pagar
 * se pide iniciar sesión. El pago todavía no está disponible: el botón "Ir al pago"
 * abre un aviso honesto en lugar de simular una compra.
 */

import { getCartItems, updateQuantity, removeFromCart, getCartTotal, syncCartWithSupabase } from '../services/cart'
import { subscribeToAuthStateChanges } from '../services/auth'
import { showToast } from '../services/toast'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const TYPE_LABELS = {
    SUPPLY: 'Insumo',
    PROSTHESIS: 'Prótesis',
    PLASTER_SERVICE: 'Modelado en yeso',
    RENTAL: 'Alquiler',
}

export default {
    name: 'Cart',
    components: {
        LoadingSpinner,
        ConfirmModal
    },
    data() {
        return {
            loading: true,
            busyId: null,
            showCheckoutModal: false,
            itemToRemove: null,
            userId: null,
        }
    },
    computed: {
        cartItems() {
            return getCartItems().value
        },
        cartTotal() {
            return getCartTotal()
        },
        isEmpty() {
            return this.cartItems.length === 0
        },
        itemCount() {
            return this.cartItems.reduce((n, i) => n + (i.quantity || 0), 0)
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price || 0)
        },
        formatDate(value) {
            if (!value) return ''
            const d = new Date(`${value}T00:00:00`)
            return isNaN(d) ? value : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
        },
        typeLabel(type) {
            return TYPE_LABELS[type] || ''
        },
        detailPath(item) {
            return `/productos/${item.product_id}`
        },
        async changeQuantity(item, delta) {
            const next = item.quantity + delta
            if (next < 1) return
            this.busyId = item.id
            try { await updateQuantity(item.id, next) } finally { this.busyId = null }
        },
        async confirmRemoveItem() {
            const item = this.itemToRemove
            this.itemToRemove = null
            this.busyId = item.id
            try {
                await removeFromCart(item.id)
                showToast(`${item.name} se quitó del carrito`)
            } catch {
                showToast('No se pudo quitar el artículo del carrito', 'error')
            } finally {
                this.busyId = null
            }
        },
        openCheckout() {
            if (!this.userId) {
                showToast('Iniciá sesión para finalizar tu compra. Tu carrito queda guardado.', 'info', 5000)
                this.$router.push({ path: '/login', query: { redirect: '/carrito' } })
                return
            }
            this.showCheckoutModal = true
            this.$nextTick(() => this.$refs.modalButton?.focus())
        },
        closeCheckoutModal() {
            this.showCheckoutModal = false
            this.$nextTick(() => this.$refs.checkoutButton?.focus())
        },
        onKeydown(e) {
            if (e.key === 'Escape' && this.showCheckoutModal) this.closeCheckoutModal()
        }
    },
    async mounted() {
        this.unsubscribeAuth = subscribeToAuthStateChanges(user => { this.userId = user.id })
        document.addEventListener('keydown', this.onKeydown)
        try {
            await syncCartWithSupabase()
        } finally {
            this.loading = false
        }
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        document.removeEventListener('keydown', this.onKeydown)
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-8 pb-16">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <h1 class="font-heading text-3xl font-bold text-gray-800 m-0">Mi carrito</h1>
                <p v-if="!loading && !isEmpty" class="text-gray-600 m-0">{{ itemCount }} {{ itemCount === 1 ? 'artículo' : 'artículos' }}</p>
            </div>

            <LoadingSpinner v-if="loading" message="Cargando carrito..." />

            <div v-else-if="isEmpty" class="bg-white rounded-xl border border-gray-200 p-10 sm:p-12 text-center">
                <svg class="w-20 h-20 mx-auto text-primary-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
                <p class="text-gray-600 mb-6">Agregá insumos, prótesis o alquileres desde el catálogo.</p>
                <RouterLink to="/productos"
                    class="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    Ver catálogo
                </RouterLink>
            </div>

            <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                <ul class="lg:col-span-2 space-y-4" aria-label="Artículos en el carrito">
                    <li v-for="item in cartItems" :key="item.id"
                        class="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 transition-opacity"
                        :class="{ 'opacity-60': busyId === item.id }">
                        <div class="flex gap-4">
                            <RouterLink :to="detailPath(item)" class="flex-shrink-0" tabindex="-1" aria-hidden="true">
                                <img :src="item.image || '/placeholder-product.svg'" alt=""
                                    class="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-lg bg-gray-100" />
                            </RouterLink>

                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start gap-2">
                                    <div class="min-w-0">
                                        <p v-if="typeLabel(item.product_type)" class="text-xs font-semibold text-secondary-800 mb-0.5">{{ typeLabel(item.product_type) }}</p>
                                        <h2 class="font-heading text-base sm:text-lg font-bold text-gray-800 mb-0.5 leading-snug">
                                            <RouterLink :to="detailPath(item)" class="hover:underline">{{ item.name }}</RouterLink>
                                        </h2>
                                        <p class="text-xs text-gray-600 m-0">Vendido por {{ item.seller?.username }}</p>
                                    </div>
                                    <button @click="itemToRemove = item" type="button" :disabled="busyId === item.id"
                                        :aria-label="`Quitar ${item.name} del carrito`"
                                        class="flex-shrink-0 w-10 h-10 -mr-2 -mt-1 rounded-full flex items-center justify-center text-gray-500 hover:text-red-700 hover:bg-red-50 transition">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>

                                <div v-if="item.product_type === 'RENTAL' && item.rental_details" class="mt-3 bg-primary-50 px-3 py-2 rounded-lg text-sm text-gray-700">
                                    <p class="m-0"><span class="font-medium">Del</span> {{ formatDate(item.rental_details.start_date) }} ({{ item.rental_details.start_time }}) <span class="font-medium">al</span> {{ formatDate(item.rental_details.end_date) }} ({{ item.rental_details.end_time }})</p>
                                    <p class="m-0 text-gray-600">{{ item.rental_details.total_days }} {{ item.rental_details.total_days === 1 ? 'día' : 'días' }}</p>
                                </div>

                                <div v-if="item.product_type === 'PLASTER_SERVICE' && item.custom_description" class="mt-3 bg-secondary-50 px-3 py-2 rounded-lg">
                                    <p class="text-xs font-semibold text-gray-700 mb-0.5">Tu pedido</p>
                                    <p class="text-sm text-gray-700 m-0 line-clamp-3">{{ item.custom_description }}</p>
                                </div>

                                <p v-if="item.product_type === 'PROSTHESIS' && item.config" class="mt-3 text-sm text-gray-700 bg-accent-50 px-3 py-2 rounded-lg m-0">
                                    {{ (item.config.teeth?.length || item.config.combinations?.length || 0) }}
                                    {{ (item.config.teeth?.length || item.config.combinations?.length || 0) === 1 ? 'pieza' : 'piezas' }} configuradas
                                </p>

                                <div class="flex items-end justify-between gap-3 mt-3">
                                    <div v-if="item.product_type === 'SUPPLY'" class="flex items-center border border-gray-300 rounded-lg" role="group" :aria-label="`Cantidad de ${item.name}`">
                                        <button @click="changeQuantity(item, -1)" type="button" aria-label="Restar uno"
                                            class="w-10 h-10 text-lg hover:bg-gray-100 transition rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                            :disabled="item.quantity <= 1 || busyId === item.id">
                                            −
                                        </button>
                                        <output class="w-10 text-center font-semibold tabular-nums" aria-live="polite">{{ item.quantity }}</output>
                                        <button @click="changeQuantity(item, 1)" type="button" aria-label="Sumar uno"
                                            :disabled="busyId === item.id"
                                            class="w-10 h-10 text-lg hover:bg-gray-100 transition rounded-r-lg disabled:opacity-40">
                                            +
                                        </button>
                                    </div>
                                    <span v-else></span>

                                    <div class="text-right">
                                        <p v-if="item.quantity > 1" class="text-xs text-gray-600 m-0 tabular-nums">${{ formatPrice(item.price) }} c/u</p>
                                        <p class="text-lg font-bold text-gray-900 m-0 tabular-nums">${{ formatPrice(item.price * item.quantity) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>

                <aside class="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-24" aria-labelledby="summary-title">
                    <h2 id="summary-title" class="font-heading text-xl font-bold text-gray-800 mb-4">Resumen</h2>

                    <dl class="space-y-3 mb-5 pb-5 border-b border-gray-200 text-gray-700">
                        <div class="flex justify-between">
                            <dt>Subtotal</dt>
                            <dd class="tabular-nums m-0">${{ formatPrice(cartTotal) }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt>Envío</dt>
                            <dd class="text-sm text-gray-600 m-0">Se calcula al pagar</dd>
                        </div>
                    </dl>

                    <div class="flex justify-between items-baseline mb-6">
                        <span class="font-heading text-lg font-bold text-gray-800">Total</span>
                        <span class="font-heading text-2xl font-bold text-gray-900 tabular-nums">${{ formatPrice(cartTotal) }}</span>
                    </div>

                    <button ref="checkoutButton" @click="openCheckout" type="button"
                        class="w-full h-12 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition mb-3">
                        Ir al pago
                    </button>

                    <RouterLink to="/productos"
                        class="block w-full text-center py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition">
                        Seguir comprando
                    </RouterLink>
                </aside>
            </div>
        </div>

        <!-- Aviso de pago no disponible -->
        <div v-if="showCheckoutModal" @click.self="closeCheckoutModal"
            class="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
            <div role="dialog" aria-modal="true" aria-labelledby="checkout-title" aria-describedby="checkout-desc"
                class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-primary-50 text-primary" aria-hidden="true">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h2 id="checkout-title" class="text-2xl font-bold text-gray-800 mb-3">El pago online llega pronto</h2>
                <p id="checkout-desc" class="text-gray-600 mb-6">
                    Todavía no se pueden finalizar compras desde ProviDent. Tu carrito queda guardado para cuando esté disponible.
                </p>
                <button ref="modalButton" @click="closeCheckoutModal" type="button"
                    class="w-full h-12 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    Entendido
                </button>
            </div>
        </div>

        <ConfirmModal v-if="itemToRemove"
            title="Quitar del carrito"
            :message="`¿Querés quitar “${itemToRemove.name}” del carrito?`"
            confirm-text="Quitar"
            @confirm="confirmRemoveItem"
            @cancel="itemToRemove = null" />
    </div>
</template>
