<script>
/**
 * Propósito: Vista principal del catálogo de productos y servicios del marketplace (público).
 * Función: Mostrar una lista de todos los productos activos, con herramientas para filtrado por categoría, búsqueda por texto y ordenamiento. Ofrece opciones para el usuario no vendedor (`becomeSeller`).
 * Cómo funciona: `loadProducts` obtiene la lista activa de productos. Los métodos `filterByCategory`, `handleSearch` y `handleSort` manipulan la lista `filteredProducts` de forma reactiva. `becomeSeller` autootorga el rol de vendedor y redirige al setup inicial, usando los servicios de `sellers.js`.
 */
import { subscribeToAuthStateChanges } from '../services/auth'
import ProductCard from '../components/ProductCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { listActiveProducts } from '../services/products'
import { isCurrentUserSeller, grantSellerSelf, connectDummyPaymentAccount } from '../services/sellers'

export default {
    name: 'Products',
    components: {
        ProductCard,
        CategoryIcon,
        LoadingSpinner
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
                avatar_url: null,
            },
            isSeller: false,
            sellerMessage: '',
            products: [],
            categories: [],
            filteredProducts: [],
            selectedCategory: null,
            searchQuery: '',
            loading: false,
            sortBy: 'recent',
        }
    },
    computed: {
        supplyProducts() {
            return this.filteredProducts.filter(p => p.product_type === 'SUPPLY')
        },
        serviceProducts() {
            return this.filteredProducts.filter(p =>
                p.product_type === 'PROSTHESIS' ||
                p.product_type === 'PLASTER_SERVICE' ||
                p.product_type === 'RENTAL'
            )
        }
    },
    methods: {
        async refreshSeller() {
            this.isSeller = this.user?.id ? await isCurrentUserSeller() : false
        },
        async becomeSeller() {
            try {
                await grantSellerSelf()
                await connectDummyPaymentAccount('MERCADOPAGO')
                await this.refreshSeller()
                this.$router.push('/seller-setup')
            } catch (e) {
                this.sellerMessage = 'No se pudo activar vendedor.'
                setTimeout(() => { this.sellerMessage = '' }, 3000)
            }
        },
        async loadProducts() {
            try {
                this.loading = true
                const items = await listActiveProducts()
                this.products = items
                this.filteredProducts = items
            } catch (e) {
                console.error('Failed loading products:', e?.message || e)
            } finally {
                this.loading = false
            }
        },
        filterByCategory(categoryId) {
            if (this.selectedCategory === categoryId) {
                this.selectedCategory = null
                this.filteredProducts = this.products
            } else {
                this.selectedCategory = categoryId
                this.filteredProducts = this.products.filter(p => p.category_id === categoryId)
            }
        },
        handleSearch() {
            if (!this.searchQuery.trim()) {
                this.filteredProducts = this.selectedCategory
                    ? this.products.filter(p => p.category_id === this.selectedCategory)
                    : this.products
                return
            }

            const query = this.searchQuery.toLowerCase()
            this.filteredProducts = this.products.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            )

            if (this.selectedCategory) {
                this.filteredProducts = this.filteredProducts.filter(p => p.category_id === this.selectedCategory)
            }
        },
        handleSort() {
            const sorted = [...this.filteredProducts]
            switch(this.sortBy) {
                case 'price-asc':
                    sorted.sort((a, b) => (a.price || a.price_day || 0) - (b.price || b.price_day || 0))
                    break
                case 'price-desc':
                    sorted.sort((a, b) => (b.price || b.price_day || 0) - (a.price || a.price_day || 0))
                    break
                case 'name':
                    sorted.sort((a, b) => a.name.localeCompare(b.name))
                    break
                default:
                    sorted.sort((a, b) => b.id - a.id)
            }
            this.filteredProducts = sorted
        }
    },
    watch: {
        sortBy() {
            this.handleSort()
        }
    },
    async mounted() {
        subscribeToAuthStateChanges(async newUserState => {
            this.user = newUserState
            await this.refreshSeller()
        })
        await this.loadProducts()

        if (this.$route.query.search) {
            this.searchQuery = this.$route.query.search
            this.handleSearch()
        }
    }
}
</script>

<template>
    <section class="pt-20 min-h-screen pb-12 relative overflow-hidden" style="background-color: #F5FEFF;">
        <div class="organic-shape organic-shape-1"></div>
        <div class="organic-shape organic-shape-2"></div>
        <div class="organic-shape organic-shape-3"></div>
        <div class="organic-shape organic-shape-4"></div>
        <div class="organic-shape organic-shape-5"></div>
        <div class="organic-shape organic-shape-6"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Catálogo de productos</h1>
                <RouterLink v-if="user.id && isSeller" to="/publicar"
                    class="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">
                    Publicar nuevo
                </RouterLink>
                <button v-else-if="user.id && !isSeller" @click="becomeSeller"
                    class="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">
                    Quiero vender
                </button>
            </div>

            <div v-if="sellerMessage" class="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700">
                {{ sellerMessage }}
            </div>
            <div class="mb-6 flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                    <div class="relative">
                        <input v-model="searchQuery" @input="handleSearch" type="text"
                            placeholder="Buscar por nombre, marca o categoría..."
                            aria-label="Buscar productos"
                            class="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm">
                        <svg class="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                <select v-model="sortBy" aria-label="Ordenar productos" class="px-4 py-3 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm">
                    <option value="recent">Más recientes</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                    <option value="name">Nombre A-Z</option>
                </select>
            </div>

            <div class="mb-6">
                <p class="text-sm font-semibold text-gray-700 mb-3">Filtrar por categoría:</p>
                <div class="flex flex-wrap gap-3">
                    <button
                        @click="filterByCategory(null)"
                        :class="selectedCategory === null ? 'bg-sky-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'"
                        class="px-4 py-2 rounded-lg font-medium transition">
                        Todas
                    </button>
                    <button v-for="category in categories" :key="category.id"
                        @click="filterByCategory(category.id)"
                        :class="selectedCategory === category.id ? 'bg-sky-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'"
                        class="px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                        <div class="w-5 h-5">
                            <CategoryIcon :icon="category.icon" />
                        </div>
                        {{ category.name }}
                    </button>
                </div>
            </div>

            <LoadingSpinner v-if="loading" message="Cargando productos..." />

            <div v-else-if="filteredProducts.length">
                <!-- Productos -->
                <div v-if="supplyProducts.length" class="mb-12">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
                        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <svg class="w-7 h-7 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                            </svg>
                            Productos
                        </h2>
                        <div class="flex-1 h-px bg-gradient-to-r from-sky-300 via-transparent to-transparent"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <ProductCard
                            v-for="product in supplyProducts"
                            :key="product.id"
                            :product="product"
                        />
                    </div>
                </div>

                <!-- Servicios -->
                <div v-if="serviceProducts.length">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent"></div>
                        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <svg class="w-7 h-7 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>
                            </svg>
                            Servicios
                        </h2>
                        <div class="flex-1 h-px bg-gradient-to-r from-teal-300 via-transparent to-transparent"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <ProductCard
                            v-for="product in serviceProducts"
                            :key="product.id"
                            :product="product"
                        />
                    </div>
                </div>
            </div>

            <div v-else class="text-center py-16">
                <div class="w-20 h-20 mx-auto mb-4 text-gray-400">
                    <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500 mb-4">Intenta con otros filtros o términos de búsqueda</p>
                <button @click="searchQuery = ''; selectedCategory = null; handleSearch()"
                    class="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">
                    Limpiar filtros
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.organic-shape {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.6;
    z-index: 0;
}

.organic-shape-1 {
    width: 500px;
    height: 500px;
    background: #A4C5DF;
    top: 100px;
    right: -100px;
    animation: float 20s ease-in-out infinite;
}

.organic-shape-2 {
    width: 700px;
    height: 700px;
    background: #D4F4EC;
    bottom: -200px;
    left: -150px;
    border-radius: 60% 50% 40% 60%;
    animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-3 {
    width: 400px;
    height: 400px;
    background: #F8E8E2;
    top: 50%;
    left: -100px;
    border-radius: 40% 60% 50% 40%;
    animation: float 30s ease-in-out infinite;
}

.organic-shape-4 {
    width: 350px;
    height: 350px;
    background: #E3EEF8;
    top: 30%;
    right: 10%;
    border-radius: 55% 45% 60% 40%;
    animation: float 22s ease-in-out infinite;
}

.organic-shape-5 {
    width: 600px;
    height: 600px;
    background: #A4C5DF;
    bottom: -250px;
    right: -200px;
    border-radius: 45% 55% 40% 60%;
    animation: float 28s ease-in-out infinite reverse;
}

.organic-shape-6 {
    width: 300px;
    height: 300px;
    background: #D4F4EC;
    top: 70%;
    right: -80px;
    border-radius: 50% 50% 45% 55%;
    animation: float 35s ease-in-out infinite;
}

@keyframes float {
    0%, 100% {
        transform: translate(0, 0) rotate(0deg);
    }
    33% {
        transform: translate(30px, -30px) rotate(5deg);
    }
    66% {
        transform: translate(-20px, 20px) rotate(-5deg);
    }
}
</style>
