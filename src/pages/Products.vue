<script>
import { subscribeToAuthStateChanges } from '../services/auth'
import ProductCard from '../components/ProductCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import { products, categories } from '../data/mockProducts'

export default {
    name: 'Products',
    components: {
        ProductCard,
        CategoryIcon
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
                avatar_url: null,
            },
            products: [],
            categories: [],
            filteredProducts: [],
            selectedCategory: null,
            searchQuery: '',
            loading: false,
            sortBy: 'recent',
        }
    },
    methods: {
        loadMockData() {
            this.loading = true
            setTimeout(() => {
                this.products = products
                this.filteredProducts = products
                this.categories = categories
                this.loading = false

                const urlParams = new URLSearchParams(window.location.search)
                const categorySlug = urlParams.get('categoria')
                if (categorySlug) {
                    const category = categories.find(c => c.slug === categorySlug)
                    if (category) {
                        this.filterByCategory(category.id)
                    }
                }
            }, 500)
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
                p.name.toLowerCase().includes(query) ||
                p.brand?.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
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
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        this.loadMockData()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-20">
        <div class="bg-white border-b border-gray-200 py-6">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">Catálogo de Productos</h1>
                        <p class="text-gray-600">{{ filteredProducts.length }} productos disponibles</p>
                    </div>

                    <RouterLink v-if="user.id" to="/publicar"
                        class="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">
                        Publicar producto
                    </RouterLink>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="mb-6 flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                    <div class="relative">
                        <input v-model="searchQuery" @input="handleSearch" type="text"
                            placeholder="Buscar por nombre, marca o categoría..."
                            class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <svg class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                <select v-model="sortBy" class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="recent">Más recientes</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                    <option value="name">Nombre A-Z</option>
                </select>
            </div>

            <div class="mb-6">
                <h2 class="text-sm font-semibold text-gray-700 mb-3">Filtrar por categoría:</h2>
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

            <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div v-for="i in 8" :key="i" class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="animate-pulse">
                        <div class="h-48 bg-gray-200 rounded mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>

            <div v-else-if="filteredProducts.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <ProductCard
                    v-for="product in filteredProducts"
                    :key="product.id"
                    :product="product"
                />
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
    </div>
</template>
