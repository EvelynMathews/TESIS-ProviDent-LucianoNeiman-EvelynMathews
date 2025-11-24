<script>
import { getCartItems, getCartTotal, removeFromCart } from '../services/cart'

export default {
    name: 'MiniCart',
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
            return new Intl.NumberFormat('es-AR').format(price)
        },
        async removeItem(itemId) {
            await removeFromCart(itemId)
        }
    }
}
</script>

<template>
    <div class="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
        <div v-if="isEmpty" class="p-6 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-gray-600 font-medium">Tu carrito está vacío</p>
        </div>

        <div v-else>
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-heading font-bold text-lg text-gray-800">Mi Carrito</h3>
            </div>

            <div class="divide-y divide-gray-200">
                <div v-for="item in cartItems" :key="item.id" class="p-4 hover:bg-gray-50 transition">
                    <div class="flex gap-3">
                        <img v-if="item.image" :src="item.image" :alt="item.name"
                            class="w-16 h-16 object-cover rounded flex-shrink-0" />
                        <div v-else class="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>

                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-sm text-gray-800 truncate">{{ item.name }}</h4>
                            <p class="text-xs text-gray-500 truncate">{{ item.seller.username }}</p>

                            <div v-if="item.product_type === 'RENTAL' && item.rental_details" class="mt-1">
                                <p class="text-xs text-blue-600">
                                    {{ item.rental_details.start_date }} - {{ item.rental_details.end_date }}
                                </p>
                            </div>

                            <div v-if="item.product_type === 'PLASTER_SERVICE' && item.custom_description" class="mt-1">
                                <p class="text-xs text-purple-600 truncate" :title="item.custom_description">
                                    {{ item.custom_description }}
                                </p>
                            </div>

                            <div class="flex items-center justify-between mt-2">
                                <span class="text-xs text-gray-600">Cantidad: {{ item.quantity }}</span>
                                <span class="font-bold text-sm text-gray-800">${{ formatPrice(item.price * item.quantity) }}</span>
                            </div>
                        </div>

                        <button @click="removeItem(item.id)"
                            class="text-red-500 hover:text-red-700 transition flex-shrink-0">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-4 bg-gray-50 border-t border-gray-200">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-semibold text-gray-700">Subtotal:</span>
                    <span class="font-bold text-xl text-primary">${{ formatPrice(cartTotal) }}</span>
                </div>

                <div class="space-y-2">
                    <RouterLink to="/carrito"
                        class="block w-full text-center py-2 px-4 bg-white border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition">
                        Ver carrito completo
                    </RouterLink>
                    <button
                        class="w-full py-2 px-4 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90"
                        style="background-color: #2A6FAF;">
                        Ir al pago
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
