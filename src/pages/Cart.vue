<script>
/**
 * Vista del carrito de compras del usuario.
 * Propósito: Mostrar los productos y servicios que el usuario ha agregado,
 * permitir la modificación de cantidades, la eliminación de ítems y calcular
 * el subtotal de la compra.
 * Funcionamiento: Utiliza el servicio `cart.js` (basado en estado local/mock)
 * para acceder a los ítems (`cartItems`) y realizar las operaciones CRUD
 * (`increaseQuantity`, `removeFromCart`). Las propiedades calculadas
 * (`cartTotal`, `isEmpty`) manejan el resumen del pedido y la lógica de la vista vacía.
 */

import { getCartItems, updateQuantity, removeFromCart, getCartTotal, syncCartWithSupabase } from '../services/cart'
import { subscribeToAuthStateChanges } from '../services/auth'

export default {
    name: 'Cart',
    data() {
        return {
            user: {
                id: null,
                email: null,
            }
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
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
        increaseQuantity(itemId, currentQuantity) {
            updateQuantity(itemId, currentQuantity + 1)
        },
        decreaseQuantity(itemId, currentQuantity) {
            if (currentQuantity > 1) {
                updateQuantity(itemId, currentQuantity - 1)
            }
        },
        removeItem(itemId) {
            if (confirm('¿Estás seguro de que deseas eliminar este artículo del carrito?')) {
                removeFromCart(itemId)
            }
        },
        checkout() {
            alert('Funcionalidad de checkout próximamente disponible')
        }
    },
    async mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        await syncCartWithSupabase()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-20 pb-12">
        <div class="max-w-7xl mx-auto px-4">
            <h1 class="font-heading text-3xl font-bold text-gray-800 mb-8">Mi Carrito</h1>

            <div v-if="isEmpty" class="bg-white rounded-lg shadow-md p-12 text-center">
                <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
                <p class="text-gray-600 mb-6">Comienza a agregar productos y servicios</p>
                <RouterLink to="/"
                    class="inline-block px-6 py-3 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90"
                    style="background-color: #2A6FAF;">
                    Explorar productos
                </RouterLink>
            </div>

            <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-4">
                    <div v-for="item in cartItems" :key="item.id"
                        class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex gap-6">
                            <img :src="item.image" :alt="item.name"
                                class="w-32 h-32 object-cover rounded-lg flex-shrink-0" />

                            <div class="flex-1">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 class="font-heading text-lg font-bold text-gray-800 mb-1">
                                            {{ item.name }}
                                        </h3>
                                        <p class="text-sm text-gray-600 mb-1">
                                            <span v-if="item.type === 'product'">{{ item.brand }}</span>
                                            <span v-if="item.type === 'service'">{{ item.provider }}</span>
                                        </p>
                                        <p class="text-xs text-gray-500">
                                            Vendido por {{ item.seller.username }}
                                        </p>
                                    </div>
                                    <button @click="removeItem(item.id)"
                                        class="text-red-500 hover:text-red-700 transition p-2">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>

                                <div v-if="item.config" class="mb-3">
                                    <p class="text-sm text-gray-600">
                                        <span class="font-semibold">Configuración:</span>
                                        {{ item.config.workType }} - {{ item.config.toothGroup }}
                                    </p>
                                </div>

                                <div v-if="item.product_type === 'RENTAL' && item.rental_details" class="mb-3 bg-blue-50 p-3 rounded-lg">
                                    <p class="text-sm font-semibold text-gray-800 mb-2">Período de alquiler:</p>
                                    <p class="text-sm text-gray-700">
                                        <span class="font-medium">Desde:</span> {{ item.rental_details.start_date }} {{ item.rental_details.start_time }}
                                    </p>
                                    <p class="text-sm text-gray-700">
                                        <span class="font-medium">Hasta:</span> {{ item.rental_details.end_date }} {{ item.rental_details.end_time }}
                                    </p>
                                    <p class="text-sm text-gray-700 mt-1">
                                        <span class="font-medium">Duración:</span> {{ item.rental_details.total_days }} día(s)
                                    </p>
                                </div>

                                <div v-if="item.product_type === 'PLASTER_SERVICE' && item.custom_description" class="mb-3 bg-purple-50 p-3 rounded-lg">
                                    <p class="text-sm font-semibold text-gray-800 mb-2">Descripción del trabajo:</p>
                                    <p class="text-sm text-gray-700 italic">
                                        "{{ item.custom_description }}"
                                    </p>
                                </div>

                                <div v-if="item.unit" class="mb-3">
                                    <p class="text-xs text-gray-500">{{ item.unit }}</p>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex items-center border border-gray-300 rounded-lg">
                                        <button @click="decreaseQuantity(item.id, item.quantity)"
                                            class="px-3 py-1 hover:bg-gray-100 transition"
                                            :disabled="item.quantity <= 1">
                                            -
                                        </button>
                                        <span class="px-4 py-1 border-x border-gray-300 font-semibold">
                                            {{ item.quantity }}
                                        </span>
                                        <button @click="increaseQuantity(item.id, item.quantity)"
                                            class="px-3 py-1 hover:bg-gray-100 transition">
                                            +
                                        </button>
                                    </div>

                                    <div class="text-right">
                                        <p class="text-sm text-gray-600">
                                            ${{ formatPrice(item.price) }} c/u
                                        </p>
                                        <p class="text-lg font-bold text-gray-800">
                                            ${{ formatPrice(item.price * item.quantity) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow-md p-6 sticky top-24">
                        <h2 class="font-heading text-xl font-bold text-gray-800 mb-4">
                            Resumen del pedido
                        </h2>

                        <div class="space-y-3 mb-6 pb-6 border-b border-gray-200">
                            <div class="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${{ formatPrice(cartTotal) }}</span>
                            </div>
                            <div class="flex justify-between text-gray-600">
                                <span>Envío</span>
                                <span class="text-sm">A calcular</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center mb-6">
                            <span class="font-heading text-lg font-bold text-gray-800">Total</span>
                            <span class="font-heading text-2xl font-bold" style="color: #29A68C;">
                                ${{ formatPrice(cartTotal) }}
                            </span>
                        </div>

                        <button @click="checkout"
                            class="w-full text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:opacity-90 mb-3"
                            style="background-color: #2A6FAF;">
                            Ir al pago
                        </button>

                        <RouterLink to="/productos"
                            class="block w-full text-center border-2 font-semibold py-3 px-6 rounded-lg transition hover:bg-gray-50"
                            style="color: #2A6FAF; border-color: #2A6FAF;">
                            Continuar comprando
                        </RouterLink>

                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">
                                Información
                            </h3>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li class="flex items-start gap-2">
                                    <svg class="w-5 h-5 flex-shrink-0" style="color: #29A68C;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span>Envíos a todo el país</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <svg class="w-5 h-5 flex-shrink-0" style="color: #29A68C;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span>Compra segura</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <svg class="w-5 h-5 flex-shrink-0" style="color: #29A68C;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span>Soporte especializado</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
