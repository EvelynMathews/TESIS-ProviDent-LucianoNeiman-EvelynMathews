<script>
import { subscribeToAuthStateChanges } from '../services/auth'
import { products } from '../data/mockProducts'
import ProductCard from '../components/ProductCard.vue'

export default {
    name: 'ProductDetail',
    components: {
        ProductCard
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
            },
            product: {
                id: 1,
                name: 'Resina Compuesta Flow A2',
                brand: 'DentFlow Pro',
                category: 'Materiales e Insumos',
                price: 18500,
                stock: 45,
                unit: 'Jeringa 4g',
                description: 'Resina compuesta de microhíbrida de última generación. Ideal para restauraciones anteriores y posteriores. Excelente pulido y estética natural. Incluye 4 jeringas de 4g cada una con punta aplicadora.',
                image: 'https://placehold.co/600x600/2A6FAF/ffffff?text=Resina+Flow',
                product_type: 'product',
                seller: {
                    id: 101,
                    username: 'Dental Supply BA',
                    rating: 4.8,
                    sales_count: 234,
                    location: 'Buenos Aires, CABA'
                }
            },
            quantity: 1,
            loading: false,
            relatedProducts: []
        }
    },
    computed: {
        totalPrice() {
            return this.product.price * this.quantity
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
        increaseQuantity() {
            if (this.quantity < this.product.stock) {
                this.quantity++
            }
        },
        decreaseQuantity() {
            if (this.quantity > 1) {
                this.quantity--
            }
        },
        addToCart() {
            alert(`Agregado al carrito: ${this.quantity} ${this.product.unit} de ${this.product.name}`)
        },
        loadRelatedProducts() {
            // Cargar productos de la misma categoría (excluyendo el actual)
            this.relatedProducts = products
                .filter(p => p.category === this.product.category && p.id !== this.product.id)
                .slice(0, 4)
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        this.loadRelatedProducts()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-20 pb-12">
        <div class="max-w-7xl mx-auto px-4">
            <div class="mb-6">
                <RouterLink to="/productos" class="text-primary hover:text-primary-700 font-medium">
                    ← Volver a productos
                </RouterLink>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                    <div>
                        <img :src="product.image" :alt="product.name" class="w-full rounded-lg shadow-lg" />
                    </div>

                    <div>
                        <div class="mb-4">
                            <span class="text-sm text-secondary font-semibold uppercase">{{ product.category }}</span>
                            <p v-if="product.brand" class="text-gray-500 text-sm mt-1">{{ product.brand }}</p>
                        </div>

                        <h1 class="font-heading text-3xl font-bold text-gray-800 mb-4">{{ product.name }}</h1>

                        <div class="flex items-center gap-3 mb-6">
                            <div class="flex items-center gap-1">
                                <svg class="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="text-lg font-semibold text-gray-800">{{ product.seller.rating }}</span>
                            </div>
                            <span class="text-gray-400">•</span>
                            <span class="text-sm text-gray-600">{{ product.seller.sales_count }} ventas</span>
                        </div>

                        <div class="mb-6">
                            <p class="text-4xl font-bold text-secondary mb-2">${{ formatPrice(product.price) }}</p>
                            <p class="text-sm text-gray-600">{{ product.unit }}</p>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-2">Descripción</h3>
                            <p class="text-gray-600 leading-relaxed">{{ product.description }}</p>
                        </div>

                        <div v-if="product.stock > 0" class="mb-6">
                            <p class="text-sm text-green-600 mb-3">
                                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                                Stock disponible: {{ product.stock }} unidades
                            </p>

                            <div class="flex items-center gap-4 mb-6">
                                <label class="font-semibold text-gray-700">Cantidad:</label>
                                <div class="flex items-center border border-gray-300 rounded-lg">
                                    <button @click="decreaseQuantity"
                                        class="px-4 py-2 hover:bg-gray-100 transition"
                                        :disabled="quantity <= 1">
                                        -
                                    </button>
                                    <span class="px-6 py-2 border-x border-gray-300 font-semibold">{{ quantity }}</span>
                                    <button @click="increaseQuantity"
                                        class="px-4 py-2 hover:bg-gray-100 transition"
                                        :disabled="quantity >= product.stock">
                                        +
                                    </button>
                                </div>
                            </div>

                            <div class="mb-6">
                                <p class="text-lg text-gray-700">
                                    Total: <span class="font-bold text-2xl text-primary">${{ formatPrice(totalPrice) }}</span>
                                </p>
                            </div>

                            <button @click="addToCart"
                                class="w-full text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:opacity-90"
                                style="background-color: #2A6FAF;">
                                Agregar al carrito
                            </button>
                        </div>

                        <div v-else class="mb-6">
                            <p class="text-red-600 font-semibold">Producto sin stock</p>
                        </div>

                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Vendido por</h3>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                                    {{ product.seller.username.charAt(0) }}
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-800">{{ product.seller.username }}</p>
                                    <p class="text-sm text-gray-600">{{ product.seller.location }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="relatedProducts.length > 0" class="mt-12">
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-6">Productos relacionados</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ProductCard
                        v-for="relatedProduct in relatedProducts"
                        :key="relatedProduct.id"
                        :product="relatedProduct"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
