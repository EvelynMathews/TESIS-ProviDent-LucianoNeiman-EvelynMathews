<template>
    <article class="group relative bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full transition-shadow duration-200 hover:shadow-[0_12px_28px_-10px_rgba(18,45,70,0.28)] focus-within:shadow-[0_12px_28px_-10px_rgba(18,45,70,0.28)]">
        <div class="relative flex-shrink-0 aspect-[4/3] bg-gray-100 overflow-hidden">
            <img :src="imageSrc" :alt="service.name" loading="lazy" decoding="async"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                @error="imageFailed = true" />
            <span v-if="service.category" class="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-md text-white" :class="badgeClass">
                {{ service.category }}
            </span>
        </div>

        <div class="p-3 sm:p-4 flex flex-col flex-1">
            <h3 class="font-sans font-semibold text-gray-800 text-sm sm:text-base leading-snug mb-1 line-clamp-2 m-0">
                <RouterLink :to="`/productos/${service.id}`" class="card-link outline-none">{{ service.name }}</RouterLink>
            </h3>

            <p v-if="hasRating" class="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{{ service.seller.rating }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ service.seller.sales_count }} servicios</span>
            </p>

            <p v-if="service.material" class="text-xs text-gray-600 mb-1">
                <span class="font-semibold">Material:</span> {{ service.material }}
            </p>

            <p v-if="service.delivery_time" class="flex items-center gap-1 text-xs text-secondary-800 font-medium mb-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Entrega en {{ service.delivery_time }}
            </p>

            <div class="mt-1 mb-3">
                <template v-if="isRental">
                    <p class="text-lg sm:text-xl font-bold text-gray-900 tabular-nums leading-tight">
                        ${{ formatPrice(service.price_day) }}<span class="text-sm font-medium text-gray-600"> /día</span>
                    </p>
                    <p v-if="service.price_week || service.price_month" class="text-xs text-gray-600 mt-0.5">
                        <span v-if="service.price_week">${{ formatPrice(service.price_week) }}/sem</span>
                        <span v-if="service.price_week && service.price_month"> · </span>
                        <span v-if="service.price_month">${{ formatPrice(service.price_month) }}/mes</span>
                    </p>
                </template>
                <template v-else-if="isProsthesis">
                    <p class="text-lg sm:text-xl font-bold text-gray-900 tabular-nums leading-tight">
                        <span class="text-sm font-medium text-gray-600">Desde </span>${{ formatPrice(minPrice) }}
                    </p>
                    <p class="text-xs text-gray-600 mt-0.5">Según trabajo y pieza</p>
                </template>
                <template v-else-if="service.price">
                    <p class="text-lg sm:text-xl font-bold text-gray-900 tabular-nums leading-tight">${{ formatPrice(service.price) }}</p>
                    <p class="text-xs text-gray-600 mt-0.5">{{ service.unit || 'Precio base' }}</p>
                </template>
            </div>

            <div class="mt-auto space-y-3">
                <RouterLink :to="`/productos/${service.id}`" tabindex="-1" aria-hidden="true"
                    class="relative z-10 w-full h-10 inline-flex items-center justify-center text-sm font-semibold rounded-lg border-2 border-primary text-primary hover:bg-primary-50 transition">
                    {{ isRental ? 'Elegir fechas' : 'Configurar' }}
                </RouterLink>
                <p class="text-xs text-gray-600 truncate">
                    Por
                    <RouterLink v-if="service.seller?.id" :to="`/usuario/${service.seller.id}`" class="relative z-10 hover:text-primary-700 hover:underline">{{ service.seller.username }}</RouterLink>
                    <span v-else>{{ service.seller?.username }}</span>
                </p>
            </div>
        </div>
    </article>
</template>

<script>
/**
 * Tarjeta de servicio (prótesis, modelado en yeso, alquiler) para la home.
 * Toda la tarjeta lleva al detalle, donde se configura el pedido.
 */
export default {
    name: 'ServiceCard',
    props: {
        service: {
            type: Object,
            required: true
        }
    },
    data() {
        return { imageFailed: false }
    },
    computed: {
        imageSrc() {
            return (!this.imageFailed && this.service.image) || '/placeholder-product.svg'
        },
        isRental() {
            return this.service.product_type === 'RENTAL' || this.service.service_type === 'equipment_rental'
        },
        isProsthesis() {
            return this.service.product_type === 'PROSTHESIS' || this.service.service_type === 'prosthesis'
        },
        hasRating() {
            return Number(this.service.seller?.rating) > 0 || Number(this.service.seller?.sales_count) > 0
        },
        minPrice() {
            if (!this.service.pricing_matrix) return this.service.price || 0
            let min = Infinity
            Object.values(this.service.pricing_matrix).forEach(workType => {
                Object.values(workType || {}).forEach(price => {
                    if (price !== null && price > 0 && price < min) min = price
                })
            })
            return min === Infinity ? 0 : min
        },
        badgeClass() {
            const category = (this.service.category || '').toLowerCase()
            if (category.includes('prótesis') || category.includes('protesis')) return 'bg-accent-700'
            if (category.includes('modelado') || category.includes('vaciado')) return 'bg-secondary-700'
            if (category.includes('alquiler')) return 'bg-primary-700'
            return 'bg-primary-600'
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price || 0)
        }
    }
}
</script>

<style scoped>
.card-link::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
}
.card-link:focus-visible::after {
    outline: 2px solid #2A6FAF;
    outline-offset: -2px;
    border-radius: 0.75rem;
}
</style>
