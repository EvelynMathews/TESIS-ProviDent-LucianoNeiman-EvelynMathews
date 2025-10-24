<template>
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div class="relative">
            <img :src="service.image" :alt="service.name" class="w-full h-48 object-cover" />
            <span class="absolute top-2 right-2 bg-secondary text-white text-xs px-3 py-1 rounded-full font-medium">
                {{ service.category }}
            </span>
        </div>

        <div class="p-4">
            <p v-if="service.provider" class="text-gray-500 text-xs mb-1">{{ service.provider }}</p>
            <h3 class="font-heading font-semibold text-gray-800 text-base mb-2 line-clamp-2">{{ service.name }}</h3>

            <div class="flex items-center gap-2 mb-3">
                <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="text-sm text-gray-700 font-medium">{{ service.seller.rating }}</span>
                </div>
                <span class="text-gray-400">•</span>
                <span class="text-xs text-gray-500">{{ service.seller.sales_count }} servicios</span>
            </div>

            <div v-if="service.material" class="mb-2">
                <p class="text-xs text-gray-600"><span class="font-semibold">Material:</span> {{ service.material }}</p>
            </div>

            <div v-if="service.delivery_time" class="mb-3">
                <p class="text-xs text-secondary font-medium">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Entrega: {{ service.delivery_time }}
                </p>
            </div>

            <div class="mb-3">
                <div v-if="service.service_type === 'equipment_rental'">
                    <p class="text-lg font-bold text-primary">${{ formatPrice(service.price_day) }}/día</p>
                    <p class="text-xs text-gray-500">${{ formatPrice(service.price_week) }}/sem | ${{ formatPrice(service.price_month) }}/mes</p>
                </div>
                <div v-else-if="service.service_type === 'prosthesis'">
                    <p class="text-lg font-bold text-secondary">Desde ${{ formatPrice(getMinPrice(service.pricing_matrix)) }}</p>
                    <p class="text-xs text-gray-500">Precio según tipo y ubicación</p>
                </div>
                <div v-else-if="service.price">
                    <p class="text-lg font-bold text-secondary">${{ formatPrice(service.price) }}</p>
                    <p class="text-xs text-gray-500">{{ service.unit }}</p>
                </div>
            </div>

            <RouterLink :to="`/servicios/${service.id}`"
                class="block w-full text-center text-white font-medium py-2 px-4 rounded-lg transition shadow-md hover:opacity-90"
                style="background-color: #2A6FAF;">
                Ver detalles
            </RouterLink>

            <p class="text-xs text-gray-500 mt-2 truncate">
                Por {{ service.seller.username }}
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ServiceCard',
    props: {
        service: {
            type: Object,
            required: true
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
        getMinPrice(pricingMatrix) {
            if (!pricingMatrix) return 0
            let minPrice = Infinity
            Object.values(pricingMatrix).forEach(workType => {
                Object.values(workType).forEach(price => {
                    if (price !== null && price < minPrice) {
                        minPrice = price
                    }
                })
            })
            return minPrice === Infinity ? 0 : minPrice
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
