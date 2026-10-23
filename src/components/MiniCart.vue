<script>
/**
 * Vista previa del carrito que se despliega desde la barra de navegación (escritorio).
 * Muestra los artículos, permite quitarlos y lleva al carrito completo.
 */
import { getCartItems, getCartTotal, removeFromCart } from '../services/cart'

export default {
    name: 'MiniCart',
    props: {
        loggedIn: { type: Boolean, default: false }
    },
    emits: ['close'],
    data() {
        return { removingId: null }
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
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price || 0)
        },
        async removeItem(itemId) {
            this.removingId = itemId
            try {
                await removeFromCart(itemId)
            } finally {
                this.removingId = null
            }
        }
    }
}
</script>

<template>
    <div class="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-200 shadow-[0_16px_40px_-12px_rgba(18,45,70,0.3)] z-50 overflow-hidden"
        role="dialog" aria-label="Vista previa del carrito">
        <div v-if="isEmpty" class="p-6 text-center">
            <svg class="w-12 h-12 mx-auto text-primary-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="font-semibold text-gray-800 mb-1">Tu carrito está vacío</p>
            <p v-if="!loggedIn" class="text-sm text-gray-600 mb-4">Iniciá sesión para guardar productos en tu carrito.</p>
            <p v-else class="text-sm text-gray-600 mb-4">Explorá el catálogo y agregá lo que necesites.</p>
            <RouterLink v-if="!loggedIn" :to="{ path: '/login', query: { redirect: $route.fullPath } }"
                class="inline-flex px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition">
                Iniciar sesión
            </RouterLink>
            <RouterLink v-else to="/productos"
                class="inline-flex px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition">
                Ver catálogo
            </RouterLink>
        </div>

        <div v-else>
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-heading font-bold text-base text-gray-800 m-0">Tu carrito</h2>
                <span class="text-xs text-gray-600">{{ cartItems.length }} {{ cartItems.length === 1 ? 'artículo' : 'artículos' }}</span>
            </div>

            <ul class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                <li v-for="item in cartItems" :key="item.id" class="p-4 flex gap-3">
                    <img :src="item.image || '/placeholder-product.svg'" :alt="''"
                        class="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-sm text-gray-800 truncate">{{ item.name }}</p>
                        <p class="text-xs text-gray-600 truncate">{{ item.seller?.username }}</p>
                        <p v-if="item.product_type === 'RENTAL' && item.rental_details" class="text-xs text-primary-700 mt-0.5">
                            {{ item.rental_details.start_date }} al {{ item.rental_details.end_date }}
                        </p>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-xs text-gray-600">Cant.: {{ item.quantity }}</span>
                            <span class="font-bold text-sm text-gray-800 tabular-nums">${{ formatPrice(item.price * item.quantity) }}</span>
                        </div>
                    </div>
                    <button @click="removeItem(item.id)" type="button" :disabled="removingId === item.id"
                        :aria-label="`Quitar ${item.name} del carrito`"
                        class="self-start w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-gray-500 hover:text-red-700 hover:bg-red-50 transition disabled:opacity-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </li>
            </ul>

            <div class="p-4 bg-gray-50 border-t border-gray-200">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-semibold text-gray-700">Subtotal</span>
                    <span class="font-bold text-lg text-gray-900 tabular-nums">${{ formatPrice(cartTotal) }}</span>
                </div>
                <RouterLink to="/carrito"
                    class="block w-full text-center py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    Ver carrito
                </RouterLink>
            </div>
        </div>
    </div>
</template>
