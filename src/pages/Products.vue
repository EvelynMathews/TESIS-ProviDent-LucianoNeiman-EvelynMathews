<script>
/**
 * Propósito: Vista principal del catálogo de productos y servicios del marketplace (público).
 * Función: Mostrar todas las publicaciones activas con búsqueda, filtro por tipo y ordenamiento.
 * Cómo funciona: `loadProducts` obtiene la lista activa una sola vez. Búsqueda, tipo y orden se
 * guardan en la URL (`?search=`, `?tipo=`, `?orden=`), así los filtros se pueden compartir, sobreviven
 * a recargar la página y funcionan con el botón "Atrás". `visibleProducts` calcula el resultado.
 */
import { subscribeToAuthStateChanges } from '../services/auth'
import ProductCard from '../components/ProductCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { listActiveProducts } from '../services/products'
import { isCurrentUserSeller } from '../services/sellers'
import { catalogTypes, SERVICE_TYPES } from '../data/catalog'

const SORT_OPTIONS = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'price-asc', label: 'Menor precio' },
    { value: 'price-desc', label: 'Mayor precio' },
    { value: 'name', label: 'Nombre (A-Z)' },
]

function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default {
    name: 'Products',
    components: {
        ProductCard,
        CategoryIcon,
        LoadingSpinner
    },
    data() {
        return {
            user: { id: null },
            isSeller: false,
            products: [],
            filters: [
                { slug: '', name: 'Todo', icon: 'all' },
                ...catalogTypes.map(t => ({ slug: t.slug, name: t.name, icon: t.icon, type: t.id })),
            ],
            sortOptions: SORT_OPTIONS,
            searchInput: '',
            loading: false,
            loadError: '',
        }
    },
    computed: {
        selectedSlug() {
            return this.$route.query.tipo || ''
        },
        searchQuery() {
            return this.$route.query.search || ''
        },
        sortBy() {
            return SORT_OPTIONS.some(o => o.value === this.$route.query.orden) ? this.$route.query.orden : 'recent'
        },
        selectedTypes() {
            if (this.selectedSlug === 'servicios') return SERVICE_TYPES
            const match = catalogTypes.find(t => t.slug === this.selectedSlug)
            return match ? [match.id] : null
        },
        visibleProducts() {
            const q = normalize(this.searchQuery.trim())
            let list = this.products.filter(p => {
                if (this.selectedTypes && !this.selectedTypes.includes(p.product_type)) return false
                if (!q) return true
                return normalize(p.name).includes(q) || normalize(p.description).includes(q) || normalize(p.seller?.username).includes(q)
            })
            const price = p => Number(p.price ?? p.price_day ?? 0)
            switch (this.sortBy) {
                case 'price-asc': list = [...list].sort((a, b) => price(a) - price(b)); break
                case 'price-desc': list = [...list].sort((a, b) => price(b) - price(a)); break
                case 'name': list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es')); break
                default: list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            }
            return list
        },
        hasActiveFilters() {
            return !!(this.searchQuery || this.selectedSlug)
        },
        pageTitle() {
            if (this.selectedSlug === 'servicios') return 'Servicios'
            const match = catalogTypes.find(t => t.slug === this.selectedSlug)
            return match ? match.name : 'Catálogo'
        },
        resultLabel() {
            const n = this.visibleProducts.length
            return `${n} ${n === 1 ? 'resultado' : 'resultados'}`
        }
    },
    watch: {
        searchQuery: {
            immediate: true,
            handler(value) { this.searchInput = value }
        }
    },
    methods: {
        updateQuery(patch) {
            const query = { ...this.$route.query, ...patch }
            Object.keys(query).forEach(k => { if (query[k] === '' || query[k] == null) delete query[k] })
            this.$router.replace({ query })
        },
        selectType(slug) {
            this.updateQuery({ tipo: slug === this.selectedSlug ? '' : slug })
        },
        onSearchInput() {
            clearTimeout(this._searchTimer)
            this._searchTimer = setTimeout(() => this.updateQuery({ search: this.searchInput.trim() }), 250)
        },
        clearSearch() {
            this.searchInput = ''
            this.updateQuery({ search: '' })
        },
        clearFilters() {
            this.searchInput = ''
            this.$router.replace({ query: {} })
        },
        isActive(filter) {
            if (!filter.slug) return !this.selectedSlug
            if (this.selectedSlug === 'servicios') return SERVICE_TYPES.includes(filter.type)
            return this.selectedSlug === filter.slug
        },
        async loadProducts() {
            this.loading = true
            this.loadError = ''
            try {
                this.products = await listActiveProducts()
            } catch (e) {
                console.error('Failed loading products:', e?.message || e)
                this.loadError = 'No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo.'
            } finally {
                this.loading = false
            }
        },
    },
    async mounted() {
        this.unsubscribe = subscribeToAuthStateChanges(async newUserState => {
            const changed = newUserState.id !== this.user.id
            this.user = newUserState
            if (changed) this.isSeller = newUserState.id ? await isCurrentUserSeller() : false
        })
        await this.loadProducts()
    },
    beforeUnmount() {
        clearTimeout(this._searchTimer)
        if (this.unsubscribe) this.unsubscribe()
    }
}
</script>

<template>
    <section class="min-h-screen pb-16 relative overflow-hidden bg-surface">
        <div class="organic-shape organic-shape-1"></div>
        <div class="organic-shape organic-shape-2"></div>
        <div class="organic-shape organic-shape-3"></div>
        <div class="organic-shape organic-shape-4"></div>
        <div class="organic-shape organic-shape-5"></div>
        <div class="organic-shape organic-shape-6"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
            <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-1">{{ pageTitle }}</h1>
                    <p class="text-gray-600 m-0">Insumos, prótesis, modelado en yeso y alquiler de equipos.</p>
                </div>
                <RouterLink v-if="user.id && isSeller" to="/publicar"
                    class="inline-flex items-center gap-2 h-11 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M12 5v14M5 12h14" /></svg>
                    Publicar
                </RouterLink>
                <RouterLink v-else-if="user.id" to="/seller-setup"
                    class="inline-flex items-center h-11 px-4 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition">
                    Quiero vender
                </RouterLink>
            </div>

            <div class="mb-4 flex flex-col sm:flex-row gap-3">
                <form class="flex-1" role="search" @submit.prevent="updateQuery({ search: searchInput.trim() })">
                    <label for="catalog-search" class="sr-only">Buscar en el catálogo</label>
                    <div class="relative">
                        <svg class="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input id="catalog-search" v-model="searchInput" @input="onSearchInput" type="search" enterkeyhint="search"
                            placeholder="Buscar por nombre, descripción o vendedor"
                            class="w-full h-12 pl-12 pr-12 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm">
                        <button v-if="searchInput" type="button" @click="clearSearch" aria-label="Borrar búsqueda"
                            class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                    </div>
                </form>

                <div class="flex items-center gap-2">
                    <label for="catalog-sort" class="text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por</label>
                    <select id="catalog-sort" :value="sortBy" @change="updateQuery({ orden: $event.target.value === 'recent' ? '' : $event.target.value })"
                        class="h-12 flex-1 sm:flex-none px-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm">
                        <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                </div>
            </div>

            <div class="mb-6 -mx-4 px-4 overflow-x-auto" role="group" aria-label="Filtrar por tipo">
                <div class="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
                    <button v-for="filter in filters" :key="filter.slug || 'all'" type="button"
                        @click="selectType(filter.slug)"
                        :aria-pressed="isActive(filter)"
                        class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium border transition whitespace-nowrap"
                        :class="isActive(filter) ? 'bg-primary-700 border-primary-700 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-300 hover:bg-primary-50'">
                        <span class="w-4 h-4"><CategoryIcon :icon="filter.icon" /></span>
                        {{ filter.name }}
                    </button>
                </div>
            </div>

            <LoadingSpinner v-if="loading" message="Cargando catálogo..." />

            <div v-else-if="loadError" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
                <p class="text-red-800 font-semibold mb-4">{{ loadError }}</p>
                <button type="button" @click="loadProducts" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    Reintentar
                </button>
            </div>

            <template v-else>
                <p class="text-sm text-gray-600 mb-4" role="status" aria-live="polite">
                    {{ resultLabel }}<template v-if="searchQuery"> para “{{ searchQuery }}”</template>
                </p>

                <div v-if="visibleProducts.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    <ProductCard
                        v-for="product in visibleProducts"
                        :key="product.id"
                        :product="product"
                    />
                </div>

                <div v-else class="bg-white/80 rounded-xl border border-gray-200 text-center py-14 px-6">
                    <div class="w-14 h-14 mx-auto mb-4 p-3 rounded-xl bg-primary-50 text-primary">
                        <CategoryIcon icon="all" />
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">
                        {{ products.length ? 'No encontramos resultados' : 'Todavía no hay publicaciones' }}
                    </h2>
                    <p class="text-gray-600 mb-6">
                        {{ products.length ? 'Probá con otras palabras o quitá los filtros.' : 'Volvé pronto: los vendedores están cargando sus productos.' }}
                    </p>
                    <button v-if="hasActiveFilters" type="button" @click="clearFilters"
                        class="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                        Quitar filtros
                    </button>
                </div>
            </template>
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
