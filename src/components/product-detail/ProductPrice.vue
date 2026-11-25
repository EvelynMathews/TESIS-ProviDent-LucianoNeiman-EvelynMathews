<script>
import { formatPrice } from './format'

export default {
  name: 'ProductPrice',
  props: {
    amount: { type: [Number, String], default: 0 },
    caption: { type: String, required: true },
    deposit: { type: [Number, String], default: 0 }
  },
  methods: { formatPrice }
}
</script>

<template>
  <div class="mb-6">
    <p class="text-4xl font-bold text-gray-900 mb-1 tabular-nums">${{ formatPrice(amount) }}</p>
    <p class="text-sm text-gray-600">{{ caption }}</p>
    <p v-if="deposit > 0" class="text-sm text-gray-600 mt-2">
      Depósito reembolsable: ${{ formatPrice(deposit) }}
    </p>
  </div>
</template>
