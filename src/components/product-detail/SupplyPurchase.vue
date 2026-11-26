<script>
import { formatPrice } from '../../services/format'

export default {
  name: 'SupplyPurchase',
  props: {
    product: { type: Object, required: true },
    adding: { type: Boolean, default: false }
  },
  emits: ['add-to-cart'],
  data() {
    return {
      quantity: 1
    }
  },
  computed: {
    inStock() {
      return this.product.stock > 0
    },
    totalPrice() {
      return this.product.price * this.quantity
    }
  },
  methods: {
    formatPrice,
    increaseQuantity() {
      if (this.quantity < this.product.stock) {
        this.quantity++
      }
    },
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--
      }
    },
    cartItem() {
      return { price: this.product.price, quantity: this.quantity, typeSpecificData: {} }
    }
  }
}
</script>

<template>
  <div v-if="inStock" class="mb-6">
    <p class="text-sm text-secondary-800 font-medium mb-3">
      <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      Stock disponible: {{ product.stock }} unidades
    </p>

    <div class="flex items-center gap-4 mb-6">
      <span id="qty-label" class="font-semibold text-gray-700">Cantidad</span>
      <div class="flex items-center border border-gray-300 rounded-lg" role="group" aria-labelledby="qty-label">
        <button @click="decreaseQuantity" type="button" aria-label="Restar uno"
          class="w-11 h-11 text-lg hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg"
          :disabled="quantity <= 1">
          −
        </button>
        <output class="w-14 text-center font-semibold tabular-nums border-x border-gray-300 leading-[2.75rem]" aria-live="polite">{{ quantity }}</output>
        <button @click="increaseQuantity" type="button" aria-label="Sumar uno"
          class="w-11 h-11 text-lg hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg"
          :disabled="quantity >= product.stock">
          +
        </button>
      </div>
    </div>

    <div class="mb-6">
      <p class="text-lg text-gray-700">
        Total: <span class="font-bold text-2xl text-gray-900 tabular-nums">${{ formatPrice(totalPrice) }}</span>
      </p>
    </div>

    <button @click="$emit('add-to-cart')" type="button" :disabled="adding"
      class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-70">
      {{ adding ? 'Agregando…' : 'Agregar al carrito' }}
    </button>
  </div>

  <div v-else class="mb-6">
    <p class="inline-block px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 font-semibold">Sin stock por ahora</p>
    <p class="text-sm text-gray-600 mt-2">Consultá al vendedor o mirá productos similares más abajo.</p>
  </div>

  <slot />
</template>
