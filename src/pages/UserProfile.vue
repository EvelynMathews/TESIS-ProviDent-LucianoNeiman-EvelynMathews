<script>
import { getUserProfileById } from '../services/user-profiles'
import { supabase } from '../services/supabase'
import { subscribeToAuthStateChanges } from '../services/auth'

// Helper function to get image URL (simple public URL)
function getImageUrl(path, bucket = 'product-images') {
    if (!path) return 'https://placehold.co/600x400?text=Producto'
    if (path.startsWith('http')) return path // Already a full URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data?.publicUrl || 'https://placehold.co/600x400?text=Producto'
}

function pickPrimaryImage(images) {
    const primary = images.find(img => img.is_primary)
    return primary?.path || images[0]?.path || null
}

export default {
    name: 'UserProfile',
    data() {
        return {
            user: {},
            products: [],
            loading: false,
            currentUser: { id: null },
        }
    },
    async mounted() {
        try {
            this.loading = true
            const userId = this.$route.params.id

            // Load user profile
            const profileData = await getUserProfileById(userId)

            // Get avatar URL
            if (profileData.avatar_url && !profileData.avatar_url.startsWith('http')) {
                profileData.avatar_url = getImageUrl(profileData.avatar_url, 'avatars')
            }

            this.user = profileData
            await this.fetchProducts(userId)

        } catch (error) {
            console.error('Error loading user profile:', error)
        } finally {
            this.loading = false
        }

        subscribeToAuthStateChanges(async (newUserState) => {
            this.currentUser = newUserState
        })
    },
    methods: {
        async fetchProducts(userId) {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id, name, description, product_type, created_at,
                    supply_products(unit_price, unit_label, stock_qty),
                    product_images(path, is_primary, position)
                `)
                .eq('owner_user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching products:', error)
                this.products = []
                return
            }

            // Transform data with public image URLs
            this.products = (data || []).map(p => {
                const supply = p.supply_products || {}
                const imgPath = pickPrimaryImage(p.product_images || [])

                return {
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    product_type: p.product_type,
                    price: supply.unit_price || 0,
                    unit: supply.unit_label || 'unidad',
                    stock: supply.stock_qty ?? 0,
                    image: getImageUrl(imgPath, 'product-images'),
                    created_at: p.created_at,
                }
            })
        },

        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
    },
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

        <div v-if="loading" class="flex justify-center items-center h-64 relative z-10">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-sky-600 border-t-transparent"></div>
        </div>

        <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div class="mb-6">
                <button @click="$router.go(-1)"
                    class="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition font-medium">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Volver
                </button>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="h-32" style="background: linear-gradient(135deg, #A4C5DF 0%, #D4F4EC 50%, #F8E8E2 100%);"></div>
                <div class="px-6 pb-6">
                    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16">
                        <div class="w-32 h-32 rounded-full overflow-hidden shadow-lg flex-shrink-0 border-4 border-white" style="background-color: #E3EEF8;">
                            <img v-if="user.avatar_url" :src="user.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-4xl font-bold" style="color: #2A6FAF;">
                                {{ user.username ? user.username.charAt(0).toUpperCase() : '?' }}
                            </div>
                        </div>

                        <div class="flex-1 text-center sm:text-left mt-6">
                            <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">
                                {{ user.username }}
                            </h1>
                            <div class="flex flex-wrap gap-2 justify-center sm:justify-start mb-2">
                                <span class="px-3 py-1 text-sm font-semibold rounded-full text-white shadow-md"
                                    style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                                    Vendedor
                                </span>
                            </div>
                            <p class="text-gray-600">{{ user.bio || 'Vendedor de productos odontológicos' }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="font-heading text-2xl font-bold text-gray-800">
                        Productos de {{ user.username }}
                    </h2>
                    <div class="text-sm text-gray-600">
                        {{ products.length }} producto{{ products.length !== 1 ? 's' : '' }}
                    </div>
                </div>

                <div v-if="products.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div v-for="product in products" :key="product.id"
                        class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <RouterLink :to="`/productos/${product.id}`" class="block">
                            <img :src="product.image || 'https://placehold.co/600x400?text=Producto'" :alt="product.name"
                                class="w-full h-48 object-cover" />
                            <div class="p-4">
                                <h3 class="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{{ product.name }}</h3>
                                <p class="text-2xl font-bold mb-1" style="color: #29A68C;">${{ formatPrice(product.price) }}</p>
                                <p class="text-xs text-gray-500">{{ product.unit || 'unidad' }}</p>

                                <div v-if="product.stock > 0" class="mt-2">
                                    <p class="text-xs text-green-600">Stock: {{ product.stock }}</p>
                                </div>
                                <div v-else class="mt-2">
                                    <p class="text-xs text-red-600">Sin stock</p>
                                </div>
                            </div>
                        </RouterLink>
                    </div>
                </div>

                <div v-else class="text-center py-16 space-y-4">
                    <div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style="background-color: #E3EEF8;">
                        <svg class="w-8 h-8" style="color: #2A6FAF;" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800">Sin productos</h3>
                    <p class="text-gray-600">{{ user.username }} aún no tiene productos publicados.</p>
                </div>
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

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>