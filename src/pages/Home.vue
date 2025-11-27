<script>
/**
 * Propósito: Vista principal de la aplicación (Landing Page).
 * Función: Mostrar una introducción a la plataforma, categorías, productos/servicios destacados y noticias, invitando al usuario a explorar el marketplace o registrarse/vender.
 * Cómo funciona: Combina la carga de productos activos reales (`listActiveProducts`) con datos de mock (servicios, categorías y noticias) para poblar las secciones. Se suscribe al estado de autenticación (`subscribeToAuthStateChanges`) para mostrar llamadas a la acción (CTA) dinámicas.
 */
import { subscribeToAuthStateChanges } from '../services/auth'
import ProductCard from '../components/ProductCard.vue'
import ServiceCard from '../components/ServiceCard.vue'
import CategoryIcon from '../components/CategoryIcon.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { listActiveProducts, listActiveServices } from '../services/products'
import { listPublishedNews, getNewsImageUrl } from '../services/news'
import { categories } from '../data/mockProducts'

export default {
    name: 'Home',
    components: {
        ProductCard,
        ServiceCard,
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
            featuredProducts: [],
            featuredServices: [],
            categories: [],
            news: [],
            newsImages: {},
            loadingProducts: false,
            loadingServices: false,
            loadingNews: false,
        }
    },
    methods: {
        async loadData() {
            this.categories = categories
            this.loadProducts()
            this.loadServices()
            this.loadNews()
        },
        async loadProducts() {
            try {
                this.loadingProducts = true
                const allProducts = await listActiveProducts()
                this.featuredProducts = allProducts.slice(0, 4)
            } catch (error) {
                console.error('Error cargando productos:', error)
            } finally {
                this.loadingProducts = false
            }
        },
        async loadServices() {
            try {
                this.loadingServices = true
                const allServices = await listActiveServices()
                this.featuredServices = allServices.slice(0, 4)
            } catch (error) {
                console.error('Error cargando servicios:', error)
            } finally {
                this.loadingServices = false
            }
        },
        async loadNews() {
            try {
                this.loadingNews = true
                const allNews = await listPublishedNews()
                this.news = allNews.slice(0, 4)

                for (const newsItem of this.news) {
                    if (newsItem.news_images && newsItem.news_images.length > 0) {
                        const primaryImage = newsItem.news_images.find(img => img.is_primary) || newsItem.news_images[0]
                        this.newsImages[newsItem.id] = await getNewsImageUrl(primaryImage.path)
                    }
                }
            } catch (error) {
                console.error('Error cargando noticias:', error)
            } finally {
                this.loadingNews = false
            }
        },
        formatDate(dateString) {
            const date = new Date(dateString)
            return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
        },
        showComingSoon(planName) {
            alert(`El plan ${planName} estará disponible próximamente. ¡Gracias por tu interés!`)
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        this.loadData()
    }
}
</script>

<template>
    <div class="min-h-screen relative overflow-hidden" style="background-color: #F5FEFF;">
        <div class="organic-shape organic-shape-1"></div>
        <div class="organic-shape organic-shape-2"></div>
        <div class="organic-shape organic-shape-3"></div>
        <div class="organic-shape organic-shape-4"></div>
        <div class="organic-shape organic-shape-5"></div>
        <div class="organic-shape organic-shape-6"></div>

        <section class="relative py-20 overflow-hidden z-10">
            <div class="organic-shape-hero organic-shape-hero-1"></div>
            <div class="organic-shape-hero organic-shape-hero-2"></div>
            <div class="organic-shape-hero organic-shape-hero-3"></div>
            <div class="organic-shape-hero organic-shape-hero-4"></div>
            <div class="organic-shape-hero organic-shape-hero-5"></div>

            <div class="max-w-7xl mx-auto px-4 relative z-10">
                <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="flex-1 text-center md:text-left">
                        <h1 class="font-heading text-4xl md:text-5xl font-bold mb-4" style="color: #2A6FAF;">
                            ProviDent
                        </h1>
                        <p class="text-2xl mb-6" style="color: #2A6FAF;">
                            Conectamos productos odontológicos con quienes lo necesitan
                        </p>
                        <div class="flex gap-4 justify-center md:justify-start mt-8">
                            <RouterLink to="/productos"
                                class="px-6 py-3 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90"
                                style="background-color: #2A6FAF;">
                                Explorar productos
                            </RouterLink>
                            <RouterLink v-if="!user.id" to="/register"
                                class="px-6 py-3 bg-white font-semibold rounded-lg hover:bg-gray-100 transition shadow-md"
                                style="color: #2A6FAF; border: 2px solid #2A6FAF;">
                                Registrarse
                            </RouterLink>
                        </div>
                    </div>
                    <div class="flex-1 hidden md:block">
                        <img src="/hero-dentist.webp"
                            alt="Profesional odontológico usando ProviDent"
                            class="rounded-lg shadow-2xl object-cover w-full h-auto" />
                    </div>
                </div>
            </div>
        </section>

        <section class="py-12 relative overflow-hidden z-10" style="background-color: #E8F9F5;">
            <div class="organic-shape-category organic-shape-category-1"></div>
            <div class="organic-shape-category organic-shape-category-2"></div>
            <div class="organic-shape-category organic-shape-category-3"></div>
            <div class="organic-shape-category organic-shape-category-4"></div>
            <div class="organic-shape-category organic-shape-category-5"></div>

            <div class="max-w-7xl mx-auto px-4 relative z-10">
                <h2 class="font-heading text-2xl font-bold mb-6" style="color: #2A6FAF;">Categorías principales</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <RouterLink v-for="category in categories" :key="category.id"
                        :to="`/productos?categoria=${category.slug}`"
                        class="bg-white rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 border-2"
                        style="border-color: #A4C5DF;">
                        <div class="w-16 h-16 mx-auto mb-4" style="color: #2A6FAF;">
                            <CategoryIcon :icon="category.icon" />
                        </div>
                        <h3 class="font-heading font-semibold text-gray-800 mb-2">{{ category.name }}</h3>
                        <p class="text-sm text-gray-600">{{ category.description }}</p>
                    </RouterLink>
                </div>
            </div>
        </section>

        <section class="pt-16 pb-24 bg-white relative z-10">
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
                        <div class="relative" style="max-height: 28.5rem;">
                            <img src="/provident-office.webp"
                                alt="ProviDent - Profesionales trabajando en consultorio odontológico"
                                class="rounded-lg shadow-xl w-full object-cover" style="height: 28.5rem;" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-12 relative overflow-hidden z-10" style="background-color: #FBF5F2;">
            <div class="organic-shape-products organic-shape-products-1"></div>
            <div class="organic-shape-products organic-shape-products-2"></div>
            <div class="organic-shape-products organic-shape-products-3"></div>
            <div class="organic-shape-products organic-shape-products-4"></div>
            <div class="organic-shape-products organic-shape-products-5"></div>

            <div class="max-w-7xl mx-auto px-4 relative z-10">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="font-heading text-2xl font-bold" style="color: #2A6FAF;">Productos destacados</h2>
                    <RouterLink to="/productos"
                        class="font-medium transition hover:underline"
                        style="color: #2A6FAF;">
                        Ver todos
                    </RouterLink>
                </div>

                <LoadingSpinner v-if="loadingProducts" message="Cargando productos..." />

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ProductCard
                        v-for="product in featuredProducts"
                        :key="product.id"
                        :product="product"
                        :heading-level="3"
                    />
                </div>
            </div>
        </section>

        <section class="py-12 bg-white relative z-10">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="font-heading text-2xl font-bold mb-2" style="color: #29A68C;">Servicios profesionales</h2>
                        <p class="text-gray-600">Prótesis, modelado en yeso y alquiler de equipos</p>
                    </div>
                    <RouterLink to="/servicios"
                        class="font-medium transition hover:underline"
                        style="color: #29A68C;">
                        Ver todos
                    </RouterLink>
                </div>

                <LoadingSpinner v-if="loadingServices" message="Cargando servicios..." />

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ServiceCard
                        v-for="service in featuredServices"
                        :key="service.id"
                        :service="service"
                    />
                </div>
            </div>
        </section>

        <section v-if="user.id" class="py-12 relative z-10" style="background-color: #F8E8E2;">
            <div class="max-w-7xl mx-auto px-4">
                <div class="bg-white rounded-lg shadow-md p-8 text-center">
                    <div class="w-16 h-16 mx-auto mb-4" style="color: #EBD0C7;">
                        <svg class="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                        </svg>
                    </div>
                    <RouterLink to="/publicar" class="inline-block">
                        <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2 transition cursor-pointer hover:opacity-80">
                            Quiero ser vendedor
                        </h2>
                    </RouterLink>
                    <p class="text-gray-600 mb-6">Publica tus productos o servicios y llega a miles de profesionales</p>
                    <RouterLink to="/publicar"
                        class="inline-block px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
                        style="background-color: #EBD0C7;">
                        Comenzar a vender
                    </RouterLink>
                </div>
            </div>
        </section>

        <!-- Planes de Visibilidad -->
        <section class="py-16 relative overflow-hidden" style="background-color: #F5FEFF;">
            <div class="organic-shape organic-shape-1"></div>
            <div class="organic-shape organic-shape-2"></div>
            <div class="organic-shape organic-shape-3"></div>
            <div class="organic-shape organic-shape-4"></div>

            <div class="max-w-6xl mx-auto px-4 relative z-10">
                <div class="text-center mb-12">
                    <h2 class="font-heading text-3xl font-bold text-gray-800 mb-3">¿Te interesa convertirte en vendedor?</h2>
                    <p class="text-lg text-gray-600">Es muy simple. Elegí el plan que mejor se adapte a tus necesidades</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Plan Gratuito -->
                    <div class="bg-white border-2 border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background-color: rgba(164, 197, 223, 0.2);">
                            <svg class="w-10 h-10" style="color: #A4C5DF;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                            </svg>
                        </div>
                        <div class="mb-6 flex-1">
                            <p class="text-gray-700 mb-2">Publicar hasta <strong>3 productos</strong>.</p>
                            <p class="text-gray-700 mb-2">Perfil básico <strong>sin prioridad</strong> en búsquedas.</p>
                            <p class="text-gray-700 mb-4">Ideal para <strong>probar</strong> la plataforma.</p>
                        </div>
                        <p class="text-4xl font-bold mb-6" style="color: #A4C5DF;">$0<span class="text-lg font-normal text-gray-500">/mes</span></p>
                        <button @click="showComingSoon('Gratuito')" class="w-full py-3 px-6 rounded-lg font-semibold transition text-white hover:opacity-90" style="background-color: #A4C5DF;">
                            Gratuito
                        </button>
                    </div>

                    <!-- Plan Profesional -->
                    <div class="rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 transform md:scale-105" style="background: linear-gradient(135deg, #D4EAD0 0%, #C8E4C3 100%);">
                        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background-color: rgba(255, 255, 255, 0.4);">
                            <svg class="w-10 h-10 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                            </svg>
                        </div>
                        <div class="mb-6 flex-1">
                            <p class="text-gray-700 mb-2">Publicaciones <strong>ilimitadas</strong>.</p>
                            <p class="text-gray-700 mb-2"><strong>Perfil destacado</strong> con prioridad de búsquedas.</p>
                            <p class="text-gray-700 mb-4">Acceso a <strong>métricas básicas</strong>.</p>
                        </div>
                        <p class="text-4xl font-bold text-gray-800 mb-6">$15.000<span class="text-lg font-normal text-gray-600">/mes</span></p>
                        <button @click="showComingSoon('Profesional')" class="w-full py-3 px-6 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition">
                            Profesional
                        </button>
                    </div>

                    <!-- Plan Premium -->
                    <div class="rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300" style="background: linear-gradient(135deg, #D4E9F4 0%, #C3DEF0 100%);">
                        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background-color: rgba(255, 255, 255, 0.4);">
                            <svg class="w-10 h-10 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="mb-6 flex-1">
                            <p class="text-gray-700 mb-2">Todo lo anterior +</p>
                            <p class="text-gray-700 mb-2"><strong>Reputación avanzada</strong> con reseñas destacadas.</p>
                            <p class="text-gray-700 mb-2"><strong>Promociones destacadas</strong> y cupones.</p>
                            <p class="text-gray-700 mb-4">Soporte <strong>prioritario</strong>.</p>
                        </div>
                        <p class="text-4xl font-bold text-gray-800 mb-6">$30.000<span class="text-lg font-normal text-gray-600">/mes</span></p>
                        <button @click="showComingSoon('Premium')" class="w-full py-3 px-6 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition shadow-md">
                            Premium
                        </button>
                        <p class="text-xs text-gray-600 mt-4">*visibilidad en nuestras redes con premium*</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-12 relative z-10">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="font-heading text-2xl font-bold mb-6" style="color: #2A6FAF;">Noticias y Novedades</h2>

                <LoadingSpinner v-if="loadingNews" message="Cargando noticias..." />

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <RouterLink v-for="item in news" :key="item.id" :to="`/noticias/${item.slug}`"
                        class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition block">
                        <img
                            :src="newsImages[item.id] || 'https://placehold.co/600x300/2A6FAF/ffffff?text=Noticia'"
                            :alt="item.news_images?.[0]?.alt_text || item.title"
                            class="news-card-image"
                        />
                        <div class="p-4">
                            <h3 class="font-heading font-semibold text-gray-800 mt-2 mb-2 line-clamp-2">{{ item.title }}</h3>
                            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ item.preview }}</p>
                            <p class="text-xs text-gray-500">{{ formatDate(item.published_at) }}</p>
                        </div>
                    </RouterLink>
                </div>
            </div>
        </section>

        <section v-if="!user.id" class="py-12 relative z-10" style="background-color: #F8E8E2;">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <h2 class="font-heading text-3xl font-bold mb-4" style="color: #2A6FAF;">Unite a la comunidad ProviDent</h2>
                <p class="text-xl mb-8 text-gray-700">
                    Accede a miles de productos, servicios y conecta con proveedores de confianza
                </p>
                <div class="flex gap-4 justify-center">
                    <RouterLink to="/register"
                        class="px-8 py-3 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90"
                        style="background-color: #2A6FAF;">
                        Crear cuenta
                    </RouterLink>
                    <RouterLink to="/login"
                        class="px-8 py-3 bg-white font-semibold rounded-lg hover:bg-gray-100 transition shadow-md"
                        style="color: #2A6FAF; border: 2px solid #2A6FAF;">
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
    --webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.organic-shape {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.6;
    z-index: 0;
}

.organic-shape-1 {
    width: 600px;
    height: 600px;
    background: #A4C5DF;
    top: -200px;
    left: -100px;
    animation: float 20s ease-in-out infinite;
}

.organic-shape-2 {
    width: 800px;
    height: 800px;
    background: #D4F4EC;
    bottom: -300px;
    left: 10%;
    border-radius: 60% 50% 40% 60%;
    animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-3 {
    width: 500px;
    height: 500px;
    background: #F8E8E2;
    bottom: 10%;
    right: -150px;
    border-radius: 40% 60% 50% 40%;
    animation: float 30s ease-in-out infinite;
}

.organic-shape-4 {
    width: 400px;
    height: 400px;
    background: #E3EEF8;
    top: 40%;
    right: -100px;
    border-radius: 55% 45% 60% 40%;
    animation: float 22s ease-in-out infinite;
}

.organic-shape-5 {
    width: 350px;
    height: 350px;
    background: #D4F4EC;
    top: 60%;
    left: 20%;
    border-radius: 45% 55% 40% 60%;
    animation: float 28s ease-in-out infinite reverse;
}

.organic-shape-6 {
    width: 450px;
    height: 450px;
    background: #F8E8E2;
    bottom: -150px;
    right: 30%;
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

/* Formas orgánicas específicas para la sección de categorías */
.organic-shape-category {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.4;
    z-index: 0;
}

.organic-shape-category-1 {
    width: 300px;
    height: 300px;
    background: #A4C5DF;
    top: -100px;
    right: 5%;
    border-radius: 60% 40% 50% 50%;
    animation: float 18s ease-in-out infinite;
}

.organic-shape-category-2 {
    width: 250px;
    height: 250px;
    background: #D4F4EC;
    bottom: -80px;
    left: 10%;
    border-radius: 45% 55% 45% 55%;
    animation: float 24s ease-in-out infinite reverse;
}

.organic-shape-category-3 {
    width: 200px;
    height: 200px;
    background: #F8E8E2;
    top: 50%;
    right: -50px;
    border-radius: 50% 50% 40% 60%;
    animation: float 20s ease-in-out infinite;
}

.organic-shape-category-4 {
    width: 180px;
    height: 180px;
    background: #A4C5DF;
    bottom: 20%;
    left: -40px;
    border-radius: 55% 45% 50% 50%;
    animation: float 26s ease-in-out infinite reverse;
}

.organic-shape-category-5 {
    width: 220px;
    height: 220px;
    background: #E3EEF8;
    top: 20%;
    left: 15%;
    border-radius: 40% 60% 55% 45%;
    animation: float 22s ease-in-out infinite;
}

/* Formas orgánicas específicas para la sección de productos destacados */
.organic-shape-products {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.4;
    z-index: 0;
}

.organic-shape-products-1 {
    width: 280px;
    height: 280px;
    background: #F8E8E2;
    top: -80px;
    left: 8%;
    border-radius: 60% 40% 50% 50%;
    animation: float 19s ease-in-out infinite;
}

.organic-shape-products-2 {
    width: 320px;
    height: 320px;
    background: #E3EEF8;
    bottom: -100px;
    right: 5%;
    border-radius: 45% 55% 45% 55%;
    animation: float 23s ease-in-out infinite reverse;
}

.organic-shape-products-3 {
    width: 240px;
    height: 240px;
    background: #A4C5DF;
    top: 40%;
    right: -60px;
    border-radius: 50% 50% 40% 60%;
    animation: float 21s ease-in-out infinite;
}

.organic-shape-products-4 {
    width: 200px;
    height: 200px;
    background: #D4F4EC;
    bottom: 30%;
    left: -50px;
    border-radius: 55% 45% 50% 50%;
    animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-products-5 {
    width: 260px;
    height: 260px;
    background: #F8E8E2;
    top: 60%;
    left: 20%;
    border-radius: 40% 60% 55% 45%;
    animation: float 27s ease-in-out infinite;
}

/* Formas orgánicas específicas para la sección hero */
.organic-shape-hero {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.5;
    z-index: 0;
}

.organic-shape-hero-1 {
    width: 350px;
    height: 350px;
    background: #29A68C;
    top: -100px;
    right: 10%;
    border-radius: 60% 40% 50% 50%;
    animation: float 20s ease-in-out infinite;
}

.organic-shape-hero-2 {
    width: 280px;
    height: 280px;
    background: #EBD0C7;
    bottom: -80px;
    left: 5%;
    border-radius: 45% 55% 45% 55%;
    animation: float 24s ease-in-out infinite reverse;
}

.organic-shape-hero-3 {
    width: 300px;
    height: 300px;
    background: #A4C5DF;
    top: 50%;
    left: -80px;
    border-radius: 50% 50% 40% 60%;
    animation: float 22s ease-in-out infinite;
}

.organic-shape-hero-4 {
    width: 250px;
    height: 250px;
    background: #29A68C;
    bottom: 20%;
    right: -60px;
    border-radius: 55% 45% 50% 50%;
    animation: float 26s ease-in-out infinite reverse;
}

.organic-shape-hero-5 {
    width: 320px;
    height: 320px;
    background: #EBD0C7;
    top: 20%;
    left: 15%;
    border-radius: 40% 60% 55% 45%;
    animation: float 28s ease-in-out infinite;
}
</style>
