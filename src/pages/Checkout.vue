<script>
/**
 * Propósito: Último paso antes de pagar. El comprador elige dónde recibe el pedido, revisa lo que
 * compra (agrupado por vendedor) y paga con Mercado Pago.
 * Cómo funciona: Carga el carrito, los domicilios y las provincias. Al confirmar llama a
 * `startCheckout` (Edge Function `create-checkout`), que valida todo de nuevo en el servidor,
 * crea el pedido y devuelve la URL de Mercado Pago; después redirige a esa URL.
 * Si el servidor detecta problemas (sin stock, producto pausado, vendedor sin cuenta de cobro)
 * se marcan en cada producto con la acción para resolverlos.
 */
import { getCartItems, getCartTotal, syncCartWithSupabase } from '../services/cart'
import { listMyAddresses } from '../services/addresses'
import { listProvinces } from '../services/products'
import { startCheckout } from '../services/checkout'
import { subscribeToAuthStateChanges } from '../services/auth'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import AddressForm from '../components/AddressForm.vue'
import { formatPrice, formatDate } from '../services/format'

const TYPE_LABELS = {
    SUPPLY: 'Insumo',
    PROSTHESIS: 'Prótesis',
    PLASTER_SERVICE: 'Modelado en yeso',
    RENTAL: 'Alquiler',
}

export default {
    name: 'Checkout',
    components: { LoadingSpinner, AddressForm },
    data() {
        return {
            loading: true,
            loadError: '',
            addresses: [],
            provinces: [],
            selectedAddressId: null,
            showAddressForm: false,
            paying: false,
            payError: '',
            problems: [],
            userId: null,
        }
    },
    computed: {
        newAddressDefaults() {
            return { is_primary: this.addresses.length === 0 }
        },
        cartItems() {
            return getCartItems().value
        },
        total() {
            return getCartTotal()
        },
        itemCount() {
            return this.cartItems.reduce((n, i) => n + (i.quantity || 0), 0)
        },
        groups() {
            const bySeller = {}
            for (const item of this.cartItems) {
                const key = item.seller?.id || 'sin-vendedor'
                if (!bySeller[key]) bySeller[key] = { sellerId: key, sellerName: item.seller?.username || 'Vendedor', items: [], subtotal: 0 }
                bySeller[key].items.push(item)
                bySeller[key].subtotal += (item.price || 0) * (item.quantity || 0)
            }
            return Object.values(bySeller)
        },
        /** Publicaciones propias en el carrito: no se pueden comprar (el servidor también lo valida). */
        ownItems() {
            return this.userId ? this.cartItems.filter(i => i.seller?.id === this.userId) : []
        },
        problemsByProduct() {
            const own = this.ownItems.map(i => [i.product_id, 'Es una publicación tuya: quitala del carrito para pagar'])
            return Object.fromEntries([...own, ...this.problems.map(p => [p.product_id, p.reason])])
        },
        canPay() {
            return !this.paying && this.cartItems.length > 0 && !!this.selectedAddressId && !this.showAddressForm && !this.ownItems.length
        },
        payHint() {
            if (this.ownItems.length) return 'Tu carrito tiene publicaciones tuyas. Quitalas para poder pagar.'
            if (!this.selectedAddressId) return 'Elegí o agregá un domicilio de entrega para continuar.'
            if (this.showAddressForm) return 'Guardá el domicilio para continuar.'
            return ''
        }
    },
    methods: {
        formatPrice,
        formatDate,
        typeLabel(type) {
            return TYPE_LABELS[type] || ''
        },
        addressLine(a) {
            return [a.city, a.province_name, a.postal_code ? `CP ${a.postal_code}` : ''].filter(Boolean).join(' · ')
        },
        async load() {
            this.loading = true
            this.loadError = ''
            try {
                const [, addresses, provinces] = await Promise.all([
                    syncCartWithSupabase(),
                    listMyAddresses(),
                    listProvinces(),
                ])
                this.addresses = addresses
                this.provinces = provinces
                const primary = addresses.find(a => a.is_primary) || addresses[0]
                this.selectedAddressId = primary?.id || null
                this.showAddressForm = addresses.length === 0
            } catch (e) {
                console.error('Error cargando checkout', e)
                this.loadError = 'No pudimos cargar tus datos. Revisá tu conexión e intentá de nuevo.'
            } finally {
                this.loading = false
            }
        },
        openAddressForm() {
            this.showAddressForm = true
        },
        cancelAddressForm() {
            this.showAddressForm = false
        },
        async onAddressSaved(id) {
            this.addresses = await listMyAddresses()
            this.selectedAddressId = id
            this.showAddressForm = false
        },
        async pay() {
            if (!this.canPay) return
            this.paying = true
            this.payError = ''
            this.problems = []
            try {
                const { checkout_url } = await startCheckout(this.selectedAddressId)
                window.location.assign(checkout_url)
            } catch (e) {
                this.paying = false
                this.payError = e.message
                this.problems = e.problems || []
                if (e.code === 'UNAUTHORIZED') {
                    this.$router.push({ path: '/login', query: { redirect: '/checkout' } })
                    return
                }
                if (e.code === 'EMPTY_CART') await syncCartWithSupabase()
                this.$nextTick(() => this.$refs.payErrorBox?.focus())
            }
        },
        onPageShow(event) {
            // Al volver con "Atrás" desde Mercado Pago la página puede restaurarse congelada en "cargando"
            if (event.persisted) this.paying = false
        }
    },
    mounted() {
        this.unsubscribeAuth = subscribeToAuthStateChanges(user => { this.userId = user.id })
        window.addEventListener('pageshow', this.onPageShow)
        this.load()
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        window.removeEventListener('pageshow', this.onPageShow)
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-6 pb-16">
        <div class="max-w-6xl mx-auto px-4">
            <nav aria-label="Ruta de navegación" class="mb-4 text-sm">
                <ol class="flex flex-wrap items-center gap-1 text-gray-600">
                    <li><RouterLink to="/carrito" class="text-primary-700 font-medium hover:underline">Carrito</RouterLink></li>
                    <li aria-hidden="true">/</li>
                    <li class="text-gray-700" aria-current="page">Finalizar compra</li>
                </ol>
            </nav>

            <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">Finalizar compra</h1>

            <LoadingSpinner v-if="loading" message="Preparando tu compra..." />

            <div v-else-if="loadError" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
                <p class="text-red-800 font-semibold mb-4">{{ loadError }}</p>
                <button type="button" @click="load" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
            </div>

            <div v-else-if="!cartItems.length" class="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
                <p class="text-gray-600 mb-6">Agregá productos antes de finalizar la compra.</p>
                <RouterLink to="/productos" class="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    Ver catálogo
                </RouterLink>
            </div>

            <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                <div class="lg:col-span-2 space-y-6">
                    <!-- 1. Entrega -->
                    <section class="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6" aria-labelledby="delivery-title">
                        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
                            <h2 id="delivery-title" class="font-heading text-xl font-bold text-gray-800 m-0">
                                <span class="step-badge" aria-hidden="true">1</span>¿Dónde lo recibís?
                            </h2>
                            <button v-if="addresses.length && !showAddressForm" type="button" @click="openAddressForm"
                                class="h-10 px-4 text-sm font-semibold border-2 border-primary text-primary rounded-lg hover:bg-primary-50 transition whitespace-nowrap">
                                Agregar domicilio
                            </button>
                        </div>

                        <fieldset v-if="addresses.length && !showAddressForm">
                            <legend class="sr-only">Domicilio de entrega</legend>
                            <div class="grid gap-3 sm:grid-cols-2">
                                <label v-for="a in addresses" :key="a.id" class="address-option">
                                    <input type="radio" name="shipping-address" :value="a.id" v-model="selectedAddressId" class="sr-only peer" />
                                    <span class="address-card">
                                        <span class="flex items-start justify-between gap-2">
                                            <span class="font-semibold text-gray-800 break-words">{{ a.street }}</span>
                                            <span class="radio-dot" aria-hidden="true"></span>
                                        </span>
                                        <span class="block text-sm text-gray-600">{{ addressLine(a) }}</span>
                                        <span v-if="a.recipient_name" class="block text-sm text-gray-600">Recibe: {{ a.recipient_name }}</span>
                                        <span v-if="a.is_primary" class="mt-2 inline-block text-xs font-semibold text-primary-800 bg-primary-50 rounded px-2 py-0.5">Principal</span>
                                    </span>
                                </label>
                            </div>
                        </fieldset>

                        <div v-if="showAddressForm">
                            <p v-if="!addresses.length" class="text-gray-600 mb-4">Cargá el domicilio donde querés recibir tu pedido. Queda guardado en tu perfil.</p>
                            <AddressForm :address="newAddressDefaults" :provinces="provinces" id-prefix="co"
                                submit-text="Usar este domicilio" :can-cancel="addresses.length > 0"
                                @saved="onAddressSaved" @cancel="cancelAddressForm" />
                        </div>

                        <p class="mt-4 mb-0 flex items-start gap-2 text-sm text-gray-700 bg-secondary-50 rounded-lg px-3 py-2.5">
                            <svg class="w-5 h-5 flex-shrink-0 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h5l3-4V9a1 1 0 00-1-1h-4v8M6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                            <span>El envío se coordina con cada vendedor después del pago. Te van a contactar para acordar costo y fecha.</span>
                        </p>
                    </section>

                    <!-- 2. Pedido -->
                    <section class="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6" aria-labelledby="order-title">
                        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
                            <h2 id="order-title" class="font-heading text-xl font-bold text-gray-800 m-0">
                                <span class="step-badge" aria-hidden="true">2</span>Revisá tu pedido
                            </h2>
                            <RouterLink to="/carrito" class="text-sm font-semibold text-primary-700 hover:underline whitespace-nowrap">Editar carrito</RouterLink>
                        </div>

                        <div class="space-y-5">
                            <div v-for="group in groups" :key="group.sellerId">
                                <p class="text-sm text-gray-600 mb-2">Vendido por <span class="font-semibold text-gray-800">{{ group.sellerName }}</span></p>
                                <ul class="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                                    <li v-for="item in group.items" :key="item.id" class="p-3 sm:p-4 flex gap-3"
                                        :class="{ 'bg-red-50/60': problemsByProduct[item.product_id] }">
                                        <img :src="item.image || '/placeholder-product.svg'" alt="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <p v-if="typeLabel(item.product_type)" class="text-xs font-semibold text-secondary-800 m-0">{{ typeLabel(item.product_type) }}</p>
                                            <p class="font-semibold text-gray-800 m-0 leading-snug break-words">{{ item.name }}</p>
                                            <p v-if="item.product_type === 'RENTAL' && item.rental_details" class="text-xs text-gray-600 m-0">
                                                Del {{ formatDate(item.rental_details.start_date) }} al {{ formatDate(item.rental_details.end_date) }}
                                            </p>
                                            <p class="text-xs text-gray-600 m-0">Cantidad: {{ item.quantity }}</p>
                                            <p v-if="problemsByProduct[item.product_id]" class="mt-1 text-sm font-semibold text-red-800 m-0">
                                                {{ problemsByProduct[item.product_id] }}
                                            </p>
                                        </div>
                                        <p class="font-bold text-gray-900 tabular-nums m-0 whitespace-nowrap">${{ formatPrice(item.price * item.quantity) }}</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Resumen y pago -->
                <aside class="bg-white rounded-2xl border border-gray-200 p-6 lg:sticky lg:top-24" aria-labelledby="pay-title">
                    <h2 id="pay-title" class="font-heading text-xl font-bold text-gray-800 mb-4">
                        <span class="step-badge" aria-hidden="true">3</span>Pagá
                    </h2>

                    <dl class="space-y-3 mb-5 pb-5 border-b border-gray-200 text-gray-700">
                        <div class="flex justify-between gap-3">
                            <dt>Productos ({{ itemCount }})</dt>
                            <dd class="tabular-nums m-0">${{ formatPrice(total) }}</dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt>Envío</dt>
                            <dd class="text-sm text-gray-600 m-0 text-right">A coordinar con el vendedor</dd>
                        </div>
                    </dl>

                    <div class="flex justify-between items-baseline mb-6">
                        <span class="font-heading text-lg font-bold text-gray-800">Total a pagar</span>
                        <span class="font-heading text-2xl font-bold text-gray-900 tabular-nums">${{ formatPrice(total) }}</span>
                    </div>

                    <div v-if="payError" ref="payErrorBox" tabindex="-1" class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 outline-none" role="alert">
                        <p class="text-sm font-semibold text-red-800 m-0">{{ payError }}</p>
                        <p v-if="problems.length" class="text-sm text-red-800 mt-1 mb-0">
                            Revisá los productos marcados y <RouterLink to="/carrito" class="font-semibold underline">ajustá tu carrito</RouterLink>.
                        </p>
                    </div>

                    <button type="button" @click="pay" :disabled="!canPay" :aria-busy="paying"
                        class="w-full h-12 inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg v-if="paying" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {{ paying ? 'Te llevamos a Mercado Pago…' : 'Pagar con Mercado Pago' }}
                    </button>
                    <p v-if="payHint" class="text-sm text-gray-600 mt-2 mb-0" aria-live="polite">{{ payHint }}</p>

                    <ul class="mt-5 space-y-2 text-sm text-gray-600">
                        <li class="flex gap-2">
                            <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.6-4.4A11.9 11.9 0 0112 2.9 11.9 11.9 0 013.4 5.6 12 12 0 003 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1.2-.1-2.3-.4-3.4z" /></svg>
                            Pagás en el sitio seguro de Mercado Pago: ProviDent nunca ve los datos de tu tarjeta.
                        </li>
                        <li class="flex gap-2">
                            <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            Tarjeta de crédito, débito, dinero en cuenta y otros medios.
                        </li>
                    </ul>

                    <p class="text-xs text-gray-600 mt-5 mb-0">
                        Al pagar aceptás los
                        <RouterLink to="/terminos" class="font-semibold text-primary-700 underline underline-offset-2">Términos y condiciones</RouterLink>.
                    </p>
                </aside>
            </div>
        </div>
    </div>
</template>

<style scoped>
.step-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    margin-right: 0.625rem;
    border-radius: 9999px;
    background: #E3EEF8;
    color: #1A4369;
    font-size: 0.875rem;
    font-weight: 700;
    vertical-align: 0.15em;
}

.address-option {
    display: block;
    cursor: pointer;
}

.address-card {
    display: block;
    height: 100%;
    padding: 1rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.75rem;
    transition: border-color 0.15s, background-color 0.15s;
}

.address-option:hover .address-card {
    border-color: #8FBBE3;
}

.peer:checked + .address-card {
    border-color: #2A6FAF;
    background-color: #F4F8FC;
}

.peer:focus-visible + .address-card {
    outline: 2px solid #2A6FAF;
    outline-offset: 2px;
}

.radio-dot {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    border: 2px solid #9CA3AF;
    background: #fff;
}

.peer:checked + .address-card .radio-dot {
    border: 6px solid #2A6FAF;
}
</style>
