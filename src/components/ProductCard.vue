<template>
    <article class="group relative bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full transition-shadow duration-200 hover:shadow-[0_12px_28px_-10px_rgba(18,45,70,0.28)] focus-within:shadow-[0_12px_28px_-10px_rgba(18,45,70,0.28)]">
        <div class="relative flex-shrink-0 aspect-[4/3] bg-gray-100 overflow-hidden">
            <img :src="imageSrc" :alt="product.name" loading="lazy" decoding="async"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                @error="imageFailed = true" />
            <span v-if="isOutOfStock" class="absolute top-2 left-2 bg-gray-900/85 text-white text-xs font-semibold px-2 py-1 rounded-md">
                Sin stock
            </span>
            <span v-if="typeLabel" class="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-md" :class="typeBadgeClass">
                {{ typeLabel }}
            </span>
        </div>

        <div class="p-3 sm:p-4 flex flex-col flex-1">
            <component :is="`h${headingLevel}`" class="font-sans font-semibold text-gray-800 text-sm sm:text-base leading-snug mb-1 line-clamp-2 m-0">
                <RouterLink :to="detailPath" class="card-link outline-none">
                    {{ product.name }}
                </RouterLink>
            </component>

            <p v-if="hasRating" class="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{{ product.seller.rating }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ product.seller.sales_count }} ventas</span>
            </p>

            <div class="mt-1 mb-3">
                <template v-if="product.product_type === 'RENTAL'">
                    <p class="text-lg sm:text-xl font-bold text-gray-900 tabular-nums leading-tight">
                        ${{ formatPrice(product.price_day) }}<span class="text-sm font-medium text-gray-600"> /día</span>
                    </p>
                    <p v-if="product.price_week || product.price_month" class="text-xs text-gray-600 mt-0.5">
                        <span v-if="product.price_week">${{ formatPrice(product.price_week) }}/sem</span>
                        <span v-if="product.price_week && product.price_month"> · </span>
                        <span v-if="product.price_month">${{ formatPrice(product.price_month) }}/mes</span>
                    </p>
                </template>
                <template v-else-if="product.product_type === 'PROSTHESIS'">
                    <p class="text-sm sm:text-lg font-bold text-gray-900 leading-tight">Precio según trabajo</p>
                    <p class="text-xs text-gray-600 mt-0.5">Elegí tipo de trabajo y piezas</p>
                </template>
                <template v-else>
                    <p class="text-lg sm:text-xl font-bold text-gray-900 tabular-nums leading-tight">${{ formatPrice(product.price) }}</p>
                    <p class="text-xs text-gray-600 mt-0.5">
                        {{ product.product_type === 'PLASTER_SERVICE' ? 'Precio base' : `por ${product.unit || 'unidad'}` }}
                        <template v-if="product.product_type === 'SUPPLY' && product.stock > 0 && product.stock <= 5">
                            · <span class="text-amber-800 font-medium">Quedan {{ product.stock }}</span>
                        </template>
                    </p>
                </template>
            </div>

            <p v-if="feedback" class="mb-2 px-3 py-2 rounded-lg text-xs font-medium relative z-10"
                :class="feedbackType === 'success' ? 'bg-secondary-50 text-secondary-800' : 'bg-red-50 text-red-800'"
                role="status" aria-live="polite">
                {{ feedback }}
                <RouterLink v-if="needsLogin" :to="{ path: '/login', query: { redirect: $route.fullPath } }" class="underline font-semibold ml-1">Iniciar sesión</RouterLink>
                <RouterLink v-else-if="feedbackType === 'success'" to="/carrito" class="underline font-semibold ml-1">Ver carrito</RouterLink>
            </p>

            <div class="mt-auto space-y-3">
                <button v-if="product.product_type === 'SUPPLY'" type="button" @click="onAdd"
                    :disabled="isOutOfStock || adding"
                    class="relative z-10 w-full h-10 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg transition"
                    :class="isOutOfStock ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-600 disabled:opacity-70'">
                    <svg v-if="!isOutOfStock" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14" />
                    </svg>
                    <template v-if="isOutOfStock">Sin stock</template>
                    <template v-else-if="adding">Agregando…</template>
                    <template v-else><span class="sm:hidden">Agregar</span><span class="hidden sm:inline">Agregar al carrito</span></template>
                </button>
                <RouterLink v-else :to="detailPath" tabindex="-1" aria-hidden="true"
                    class="relative z-10 w-full h-10 inline-flex items-center justify-center text-sm font-semibold rounded-lg border-2 border-primary text-primary hover:bg-primary-50 transition">
                    {{ product.product_type === 'RENTAL' ? 'Elegir fechas' : 'Configurar' }}
                </RouterLink>

                <div class="flex items-center gap-2 min-w-0">
                    <img v-if="product.seller?.avatar_url" :src="product.seller.avatar_url" alt=""
                         class="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    <span v-else aria-hidden="true" class="w-6 h-6 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {{ initials(product.seller?.username) }}
                    </span>
                    <RouterLink v-if="product.seller?.id" :to="`/usuario/${product.seller.id}`" class="relative z-10 text-xs text-gray-600 truncate hover:text-primary-700 hover:underline">
                        {{ product.seller?.username }}
                    </RouterLink>
                </div>
            </div>
        </div>
    </article>
</template>

<script>
/**
 * Tarjeta de producto/servicio del catálogo.
 * Toda la tarjeta lleva al detalle (enlace extendido sobre el título). Los insumos se pueden
 * agregar al carrito directamente; prótesis, yeso y alquiler necesitan configurarse en el detalle.
 */
import { addToCart } from '../services/cart'

const TYPE_LABELS = {
    RENTAL: 'Alquiler',
    PROSTHESIS: 'Prótesis',
    PLASTER_SERVICE: 'Modelado en yeso',
}

export default {
    name: 'ProductCard',
    props: {
        product: {
            type: Object,
            required: true
        },
        headingLevel: {
            type: Number,
            default: 2,
            validator: (value) => [2, 3, 4].includes(value)
        }
    },
    data() {
        return {
            feedback: '',
            feedbackType: 'success',
            needsLogin: false,
            adding: false,
            imageFailed: false,
        }
    },
    computed: {
        imageSrc() {
            return (!this.imageFailed && this.product.image) || '/placeholder-product.svg'
        },
        isOutOfStock() {
            return this.product.product_type === 'SUPPLY' && this.product.stock === 0
        },
        hasRating() {
            return Number(this.product.seller?.rating) > 0 || Number(this.product.seller?.sales_count) > 0
        },
        typeLabel() {
            return TYPE_LABELS[this.product.product_type] || ''
        },
        typeBadgeClass() {
            switch (this.product.product_type) {
                case 'RENTAL': return 'bg-primary-700 text-white'
                case 'PROSTHESIS': return 'bg-accent-700 text-white'
                case 'PLASTER_SERVICE': return 'bg-secondary-700 text-white'
                default: return ''
            }
        },
        detailPath() {
            return this.product.product_type === 'SUPPLY' || !this.product.product_type
                ? `/productos/${this.product.id}`
                : `/servicios/${this.product.id}`
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price || 0)
        },
        initials(name) {
            if (!name) return '?'
            const parts = String(name).trim().split(/\s+/)
            return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
        },
        async onAdd() {
            if (this.isOutOfStock || this.adding) return
            this.adding = true
            this.needsLogin = false
            try {
                const result = await addToCart({
                    id: this.product.id,
                    product_type: this.product.product_type || 'SUPPLY',
                    name: this.product.name,
                    price: this.product.price,
                    quantity: 1
                })
                this.needsLogin = !!result.needsAuth
                this.feedback = result.message
                this.feedbackType = result.success ? 'success' : 'error'
            } finally {
                this.adding = false
                clearTimeout(this._feedbackTimeout)
                this._feedbackTimeout = setTimeout(() => { this.feedback = '' }, this.needsLogin ? 6000 : 3500)
            }
        }
    },
    beforeUnmount() {
        clearTimeout(this._feedbackTimeout)
    }
}
</script>

<style scoped>
/* El enlace del título cubre toda la tarjeta: más fácil de tocar en móvil */
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
