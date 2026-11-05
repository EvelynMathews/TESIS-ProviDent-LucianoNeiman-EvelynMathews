<script>
/**
 * Propósito: Vista del perfil público de otro usuario (vendedor).
 * Función: Mostrar la información pública de un usuario (nombre, bio, ubicación, avatar) y sus publicaciones activas.
 * Cómo funciona: Carga el perfil por ID de ruta con `getUserProfileById` y filtra el catálogo activo
 * (`listActiveProducts`) por vendedor, reutilizando `ProductCard` para que precios y tipos se vean igual
 * que en el catálogo. Es pública: no hace falta iniciar sesión para ver a un vendedor.
 */
import { getUserProfileById } from '../services/user-profiles'
import { listActiveProducts } from '../services/products'
import ProductCard from '../components/ProductCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

export default {
    name: 'UserProfile',
    components: { ProductCard, LoadingSpinner },
    data() {
        return {
            user: null,
            products: [],
            loading: true,
            loadError: false,
        }
    },
    computed: {
        initials() {
            const parts = String(this.user?.username || '').trim().split(/\s+/)
            return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
        }
    },
    watch: {
        '$route.params.id'(id) {
            if (id) this.load()
        }
    },
    methods: {
        async load() {
            this.loading = true
            this.loadError = false
            try {
                const userId = this.$route.params.id
                const [profile, all] = await Promise.all([
                    /^[0-9a-f-]{36}$/i.test(userId) ? getUserProfileById(userId) : Promise.resolve(null),
                    listActiveProducts(),
                ])
                this.user = profile
                this.products = profile ? all.filter(p => p.seller?.id === userId) : []
                if (profile) document.title = `${profile.username} · ProviDent`
            } catch (error) {
                console.error('Error loading user profile:', error)
                this.loadError = true
            } finally {
                this.loading = false
            }
        },
        goBack() {
            if (window.history.length > 1) this.$router.back()
            else this.$router.push('/productos')
        }
    },
    mounted() {
        this.load()
    },
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

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
            <button type="button" @click="goBack"
                class="inline-flex items-center gap-1 mb-6 text-sm font-semibold text-primary-700 hover:underline">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Volver
            </button>

            <LoadingSpinner v-if="loading" message="Cargando perfil..." />

            <div v-else-if="loadError || !user" class="bg-white rounded-xl border border-gray-200 p-10 text-center" :role="loadError ? 'alert' : null">
                <h1 class="font-heading text-2xl font-bold text-gray-800 mb-2">{{ loadError ? 'No pudimos cargar este perfil' : 'No encontramos este vendedor' }}</h1>
                <p class="text-gray-600 mb-6">{{ loadError ? 'Revisá tu conexión e intentá de nuevo.' : 'Puede que la cuenta ya no exista o que el enlace sea incorrecto.' }}</p>
                <div class="flex flex-wrap gap-3 justify-center">
                    <button v-if="loadError" type="button" @click="load" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
                    <RouterLink to="/productos" class="px-5 py-2.5 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50">Ver catálogo</RouterLink>
                </div>
            </div>

            <template v-else>
                <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
                    <div class="h-24 sm:h-28 bg-linear-135 from-primary-100 via-secondary-soft to-accent-100"></div>
                    <div class="px-6 pb-6">
                        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 -mt-12">
                            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex-shrink-0 border-4 border-white bg-primary-50 shadow-sm">
                                <img v-if="user.avatar_url" :src="user.avatar_url" :alt="`Foto de ${user.username}`" class="w-full h-full object-cover" @error="user.avatar_url = ''" />
                                <div v-else class="w-full h-full flex items-center justify-center text-3xl font-bold text-primary" aria-hidden="true">{{ initials }}</div>
                            </div>
                            <div class="flex-1 text-center sm:text-left min-w-0 sm:pt-14">
                                <h1 class="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-1 break-words">{{ user.username }}</h1>
                                <p v-if="user.location" class="text-sm text-gray-600 m-0">{{ user.location }}</p>
                            </div>
                        </div>
                        <p v-if="user.bio" class="mt-5 text-gray-700 max-w-prose whitespace-pre-line">{{ user.bio }}</p>
                    </div>
                </div>

                <div class="flex items-baseline justify-between gap-4 mb-6">
                    <h2 class="font-heading text-2xl font-bold text-gray-800 m-0">Publicaciones</h2>
                    <p class="text-sm text-gray-600 m-0">{{ products.length }} {{ products.length === 1 ? 'publicación activa' : 'publicaciones activas' }}</p>
                </div>

                <div v-if="products.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    <ProductCard v-for="product in products" :key="product.id" :product="product" :heading-level="3" />
                </div>

                <div v-else class="bg-white rounded-xl border border-gray-200 text-center py-12 px-6">
                    <p class="text-lg font-semibold text-gray-800 mb-1">Sin publicaciones por ahora</p>
                    <p class="text-gray-600 m-0">{{ user.username }} todavía no tiene productos activos.</p>
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

.line-clamp-2 {
    display: -webkit-box;
    --webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>