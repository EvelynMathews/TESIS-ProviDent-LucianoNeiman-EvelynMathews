<script>
/**
 * Propósito: Vista de detalle para un servicio (simulada con datos de mock).
 * Función: Mostrar la información completa de un servicio (en este caso una prótesis), y permitir la configuración de sus variantes (tipo de trabajo, grupo dental) para calcular un precio final por pieza.
 * Cómo funciona: Utiliza datos de mock (`this.service`). Las propiedades computadas como `currentPrice` y `availableToothGroups` calculan y filtran las opciones dinámicamente basándose en la matriz de precios del servicio. `addToCart` simula la solicitud del servicio con la configuración seleccionada.
 */
import { subscribeToAuthStateChanges } from '../services/auth'

export default {
    name: 'ServiceDetail',
    data() {
        return {
            user: {
                id: null,
                email: null,
            },
            service: {
                id: 101,
                name: 'Corona de Zirconio',
                provider: 'Laboratorio Estético Dental',
                category: 'Prótesis por Encargo',
                service_type: 'prosthesis',
                material: 'Zirconio Multicapa',
                description: 'Corona completa de zirconio multicapa de última generación. Alta estética y resistencia excepcional. Incluye prueba de metal para ajuste perfecto. Ideal para restauraciones anteriores y posteriores. El precio varía según el tipo de trabajo y la ubicación del diente.',
                delivery_time: '7 días hábiles',
                image: 'https://placehold.co/600x600/29A68C/ffffff?text=Corona+Zirconio',
                pricing_matrix: {
                    'corona_total': {
                        'anterior': 45000,
                        'premolar': 42000,
                        'molar': 48000
                    },
                    'carilla': {
                        'anterior': 38000,
                        'premolar': 35000,
                        'molar': null
                    },
                    'incrustacion': {
                        'anterior': null,
                        'premolar': 32000,
                        'molar': 35000
                    }
                },
                seller: {
                    id: 107,
                    username: 'Laboratorio Estético Dental',
                    rating: 5.0,
                    sales_count: 289,
                    location: 'CABA, Buenos Aires'
                },
                includes: [
                    'Prueba de metal incluida',
                    'Garantía de 2 años',
                    'Ajustes sin cargo',
                    'Coordinación de entrega'
                ]
            },
            selectedWorkType: 'corona_total',
            selectedToothGroup: 'anterior',
            loading: false
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
        addToCart() {
            const price = this.currentPrice
            alert(`Agregado al carrito: ${this.service.name} - ${this.getWorkTypeName(this.selectedWorkType)} en zona ${this.selectedToothGroup} - $${this.formatPrice(price)}`)
        },
        getWorkTypeName(type) {
            const names = {
                'corona_total': 'Corona Total',
                'carilla': 'Carilla',
                'incrustacion': 'Incrustación'
            }
            return names[type] || type
        }
    },
    computed: {
        currentPrice() {
            return this.service.pricing_matrix[this.selectedWorkType]?.[this.selectedToothGroup] || 0
        },
        availableToothGroups() {
            const workType = this.service.pricing_matrix[this.selectedWorkType]
            return Object.entries(workType)
                .filter(([_, price]) => price !== null)
                .map(([group, price]) => ({ group, price }))
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-20 pb-12">
        <div class="max-w-7xl mx-auto px-4">
            <div class="mb-6">
                <RouterLink to="/" class="text-primary hover:text-primary-700 font-medium">
                    ← Volver al inicio
                </RouterLink>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                    <div>
                        <img :src="service.image" :alt="service.name" class="w-full rounded-lg shadow-lg" />
                    </div>

                    <div>
                        <div class="mb-4">
                            <span class="text-sm text-secondary font-semibold uppercase">{{ service.category }}</span>
                            <p class="text-gray-500 text-sm mt-1">{{ service.provider }}</p>
                        </div>

                        <h1 class="font-heading text-3xl font-bold text-gray-800 mb-4">{{ service.name }}</h1>

                        <div class="flex items-center gap-3 mb-6">
                            <div class="flex items-center gap-1">
                                <svg class="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="text-lg font-semibold text-gray-800">{{ service.seller.rating }}</span>
                            </div>
                            <span class="text-gray-400">•</span>
                            <span class="text-sm text-gray-600">{{ service.seller.sales_count }} servicios</span>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-2">Material</h3>
                            <p class="text-gray-600">{{ service.material }}</p>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-2">Descripción</h3>
                            <p class="text-gray-600 leading-relaxed">{{ service.description }}</p>
                        </div>

                        <div class="mb-6">
                            <p class="text-sm text-secondary font-medium">
                                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Tiempo de entrega: {{ service.delivery_time }}
                            </p>
                        </div>

                        <div class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Configurar servicio</h3>

                            <div class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de trabajo:</label>
                                <select v-model="selectedWorkType"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="corona_total">Corona Total</option>
                                    <option value="carilla">Carilla</option>
                                    <option value="incrustacion">Incrustación (Inlay/Onlay)</option>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Grupo de diente:</label>
                                <select v-model="selectedToothGroup"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option v-for="item in availableToothGroups" :key="item.group" :value="item.group">
                                        {{ item.group.charAt(0).toUpperCase() + item.group.slice(1) }} - ${{ formatPrice(item.price) }}
                                    </option>
                                </select>
                            </div>

                            <div class="pt-4 border-t border-gray-200">
                                <p class="text-lg text-gray-700 mb-2">
                                    Precio: <span class="font-bold text-3xl text-secondary">${{ formatPrice(currentPrice) }}</span>
                                </p>
                                <p class="text-xs text-gray-500">Por pieza</p>
                            </div>
                        </div>

                        <button @click="addToCart"
                            class="w-full text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:opacity-90 mb-6"
                            style="background-color: #2A6FAF;">
                            Solicitar servicio
                        </button>

                        <div v-if="service.includes" class="mb-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Incluye:</h3>
                            <ul class="space-y-2">
                                <li v-for="(item, index) in service.includes" :key="index" class="flex items-start gap-2 text-gray-600 text-sm">
                                    <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    {{ item }}
                                </li>
                            </ul>
                        </div>

                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Proveedor</h3>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                                    {{ service.seller.username.charAt(0) }}
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-800">{{ service.seller.username }}</p>
                                    <p class="text-sm text-gray-600">{{ service.seller.location }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
