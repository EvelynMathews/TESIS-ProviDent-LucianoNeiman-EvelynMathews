<template>
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div class="relative">
            <img :src="product.image" :alt="product.name" class="w-full h-48 object-cover" />
            <span v-if="product.product_type === 'rental'" class="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Alquiler
            </span>
            <span v-else-if="product.service_type" class="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                Servicio
            </span>
        </div>

        <div class="p-4">
            <p v-if="product.brand" class="text-gray-500 text-xs mb-1">{{ product.brand }}</p>
            <h3 class="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{{ product.name }}</h3>

            <div class="flex items-center gap-2 mb-2">
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="text-sm text-gray-700">{{ product.seller.rating }}</span>
                </div>
                <span class="text-gray-400">•</span>
                <span class="text-xs text-gray-500">{{ product.seller.sales_count }} ventas</span>
            </div>

            <div class="mb-3">
                <div v-if="product.product_type === 'rental'" class="space-y-1">
                    <p class="text-lg font-bold text-primary">${{ formatPrice(product.price_day) }}/día</p>
                    <p class="text-xs text-gray-500">${{ formatPrice(product.price_week) }}/semana | ${{ formatPrice(product.price_month) }}/mes</p>
                </div>
                <div v-else>
                    <p class="text-2xl font-bold text-secondary">${{ formatPrice(product.price) }}</p>
                    <p class="text-xs text-gray-500">{{ product.unit }}</p>
                </div>
            </div>

            <div v-if="product.stock !== null && product.product_type !== 'rental'" class="mb-3">
                <p v-if="product.stock > 0" class="text-xs text-green-600">
                    Stock disponible: {{ product.stock }}
                </p>
                <p v-else class="text-xs text-red-600">Sin stock</p>
            </div>

            <RouterLink :to="`/productos/${product.id}`"
                class="block w-full text-center text-white font-medium py-2 px-4 rounded-lg transition shadow-md hover:opacity-90"
                style="background-color: #2A6FAF;">
                Ver detalles
            </RouterLink>

            <p class="text-xs text-gray-500 mt-2 truncate">
                Por {{ product.seller.username }}
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProductCard',
    props: {
        product: {
            type: Object,
            required: true
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        }
    }
}
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
