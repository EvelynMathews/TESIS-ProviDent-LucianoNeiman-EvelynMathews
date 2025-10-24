<script>
import { subscribeToAuthStateChanges } from '../services/auth'
import ProductCard from '../components/ProductCard.vue'
import ServiceCard from '../components/ServiceCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import { products, services, categories, news } from '../data/mockProducts'

export default {
    name: 'Home',
    components: {
        ProductCard,
        ServiceCard,
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
            featuredProducts: [],
            featuredServices: [],
            categories: [],
            news: [],
            loading: false,
        }
    },
    methods: {
        loadMockData() {
            this.loading = true
            setTimeout(() => {
                this.featuredProducts = products.slice(0, 4)
                this.featuredServices = services.slice(0, 4)
                this.categories = categories
                this.news = news
                this.loading = false
            }, 500)
        },
        formatDate(dateString) {
            const date = new Date(dateString)
            return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
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
    <div class="min-h-screen" style="background-color: #F5FEFF;">
        <section class="relative py-20" style="background-color: #A4C5DF;">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="flex-1 text-center md:text-left">
                        <h1 class="font-heading text-4xl md:text-5xl font-bold mb-4 text-gray-800">
                            Bienvenido a ProviDent
                        </h1>
                        <p class="text-xl mb-6 text-gray-700">
                            El marketplace del ecosistema odontológico argentino
                        </p>
                        <p class="text-lg mb-8 text-gray-600">
                            Conectamos proveedores, laboratorios y profesionales en un solo lugar
                        </p>
                        <div class="flex gap-4 justify-center md:justify-start">
                            <RouterLink to="/productos"
                                class="px-6 py-3 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90"
                                style="background-color: #2A6FAF;">
                                Explorar productos
                            </RouterLink>
                            <RouterLink v-if="!user.id" to="/register"
                                class="px-6 py-3 bg-white text-primary border-2 border-primary font-semibold rounded-lg hover:bg-gray-100 transition shadow-md">
                                Registrarse
                            </RouterLink>
                        </div>
                    </div>
                    <div class="flex-1 hidden md:block">
                        <img src="https://placehold.co/600x400/ffffff/2A6FAF?text=Odontologia+Profesional"
                            alt="Hero"
                            class="rounded-lg shadow-2xl" />
                    </div>
                </div>
            </div>
        </section>

        <section class="py-12 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-6">Categorías principales</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <RouterLink v-for="category in categories" :key="category.id"
                        :to="`/productos?categoria=${category.slug}`"
                        class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300"
                        style="border: 2px solid; border-image: linear-gradient(135deg, #2A6FAF, #5799D5) 1;">
                        <div class="w-16 h-16 mx-auto mb-4 text-primary">
                            <CategoryIcon :icon="category.icon" />
                        </div>
                        <h3 class="font-heading font-semibold text-gray-800 mb-2">{{ category.name }}</h3>
                        <p class="text-sm text-gray-600">{{ category.description }}</p>
                    </RouterLink>
                </div>
            </div>
        </section>

        <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex flex-col md:flex-row items-center gap-12">
                    <div class="flex-1">
                        <h2 class="font-heading text-3xl font-bold mb-6" style="color: #2A6FAF;">
                            ¿Qué es ProviDent?
                        </h2>
                        <div class="space-y-4 text-gray-700 leading-relaxed">
                            <p>
                                <span class="font-semibold">ProviDent nació de la experiencia directa en el rubro odontológico.</span>
                                Detectamos un mercado marcado por la informalidad y el boca en boca, donde conseguir insumos
                                confiables depende de contactos y llamadas.
                            </p>
                            <p>
                                <span class="font-semibold" style="color: #29A68C;">Nuestra oportunidad:</span> centralizar
                                y democratizar el acceso a materiales —especialmente materia prima—, fomentando la economía
                                local y brindando confianza a profesionales de todo tamaño.
                            </p>
                            <p>
                                Con ProviDent, conectamos proveedores, laboratorios y profesionales en un solo lugar,
                                haciendo que el acceso a productos y servicios sea más transparente, seguro y eficiente.
                            </p>
                        </div>
                        <div class="mt-8 flex gap-4">
                            <RouterLink to="/register"
                                class="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
                                style="background-color: #29A68C;">
                                Comenzar ahora
                            </RouterLink>
                            <RouterLink to="/productos"
                                class="px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50"
                                style="color: #2A6FAF; border-color: #2A6FAF;">
                                Explorar marketplace
                            </RouterLink>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="relative">
                            <div class="absolute inset-0 rounded-lg transform rotate-3"
                                style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%); opacity: 0.1;"></div>
                            <img src="https://placehold.co/600x400/E3EEF8/2A6FAF?text=Profesionales+Odontologicos"
                                alt="ProviDent - Profesionales trabajando"
                                class="relative rounded-lg shadow-xl w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-12">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="font-heading text-2xl font-bold text-gray-800">Productos destacados</h2>
                    <RouterLink to="/productos"
                        class="text-primary hover:text-primary-700 font-medium transition">
                        Ver todos
                    </RouterLink>
                </div>

                <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="animate-pulse">
                            <div class="h-48 bg-gray-200 rounded mb-4"></div>
                            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ProductCard
                        v-for="product in featuredProducts"
                        :key="product.id"
                        :product="product"
                    />
                </div>
            </div>
        </section>

        <section class="py-12 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">Servicios profesionales</h2>
                        <p class="text-gray-600">Prótesis, modelado en yeso y alquiler de equipos</p>
                    </div>
                    <RouterLink to="/servicios"
                        class="text-secondary hover:text-secondary-700 font-medium transition">
                        Ver todos
                    </RouterLink>
                </div>

                <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="animate-pulse">
                            <div class="h-48 bg-gray-200 rounded mb-4"></div>
                            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ServiceCard
                        v-for="service in featuredServices"
                        :key="service.id"
                        :service="service"
                    />
                </div>
            </div>
        </section>

        <section v-if="user.id" class="py-12" style="background-color: #E4AE9D;">
            <div class="max-w-7xl mx-auto px-4">
                <div class="bg-white rounded-lg shadow-md p-8 text-center">
                    <div class="w-16 h-16 mx-auto mb-4 text-primary">
                        <svg class="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                        </svg>
                    </div>
                    <RouterLink to="/publicar" class="inline-block">
                        <h3 class="font-heading text-2xl font-bold text-gray-800 mb-2 hover:text-primary transition cursor-pointer">
                            Quiero ser vendedor
                        </h3>
                    </RouterLink>
                    <p class="text-gray-600 mb-6">Publica tus productos o servicios y llega a miles de profesionales</p>
                    <RouterLink to="/publicar"
                        class="inline-block px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
                        style="background-color: #E4AE9D;">
                        Comenzar a vender
                    </RouterLink>
                </div>
            </div>
        </section>

        <section class="py-12">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-6">Noticias y Novedades</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <article v-for="item in news" :key="item.id"
                        class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                        <img :src="item.image" :alt="item.title" class="w-full h-40 object-cover" />
                        <div class="p-4">
                            <span class="text-xs font-semibold text-secondary uppercase">{{ item.category }}</span>
                            <h3 class="font-heading font-semibold text-gray-800 mt-2 mb-2 line-clamp-2">{{ item.title }}</h3>
                            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ item.summary }}</p>
                            <p class="text-xs text-gray-500">{{ formatDate(item.date) }}</p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section v-if="!user.id" class="py-12" style="background-color: #E6BAAB;">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <h2 class="font-heading text-3xl font-bold mb-4 text-gray-800">Unite a la comunidad ProviDent</h2>
                <p class="text-xl mb-8 text-gray-700">
                    Accede a miles de productos, servicios y conecta con proveedores de confianza
                </p>
                <div class="flex gap-4 justify-center">
                    <RouterLink to="/register"
                        class="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition shadow-md">
                        Crear cuenta
                    </RouterLink>
                    <RouterLink to="/login"
                        class="px-8 py-3 bg-white text-primary border-2 border-primary font-semibold rounded-lg hover:bg-gray-100 transition shadow-md">
                        Iniciar sesión
                    </RouterLink>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
