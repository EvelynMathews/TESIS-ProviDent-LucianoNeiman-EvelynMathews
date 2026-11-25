<script>
export default {
  name: 'PlasterConfig',
  props: {
    product: { type: Object, required: true },
    adding: { type: Boolean, default: false }
  },
  emits: ['add-to-cart'],
  data() {
    return {
      description: '',
      error: ''
    }
  },
  computed: {
    descriptionLength() {
      return this.description.trim().length
    }
  },
  methods: {
    validate() {
      this.error = ''

      if (!this.description || this.descriptionLength === 0) {
        this.error = 'Debes describir lo que necesitas'
        return false
      }

      if (this.descriptionLength < 10) {
        this.error = 'La descripción debe tener al menos 10 caracteres'
        return false
      }

      return true
    },
    // Called by the page before adding to the cart; null means invalid
    cartItem() {
      if (!this.validate()) return null
      return {
        price: this.product.base_price,
        quantity: 1,
        typeSpecificData: {
          plaster: { custom_description: this.description.trim() }
        }
      }
    },
    reset() {
      this.description = ''
    }
  }
}
</script>

<template>
  <div class="mb-6 bg-gray-50 p-4 rounded-lg">
    <label for="plaster-description" class="block font-heading font-semibold text-gray-800 mb-1">¿Qué necesitás?</label>
    <p id="plaster-description-hint" class="text-sm text-gray-600 mb-3">Contale al laboratorio el tipo de modelo, cantidad y cualquier detalle importante.</p>
    <textarea
      id="plaster-description"
      v-model="description"
      rows="4"
      placeholder="Ej: 2 modelos de trabajo en yeso tipo IV, arcada superior completa"
      aria-describedby="plaster-description-hint plaster-description-count"
      :aria-invalid="!!error"
      class="field-input resize-y"
    ></textarea>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p id="plaster-description-count" class="field-hint">
      {{ descriptionLength }} / mínimo 10 caracteres
    </p>
  </div>

  <slot />

  <button @click="$emit('add-to-cart')" type="button" :disabled="adding"
    class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-70 mb-6">
    {{ adding ? 'Agregando…' : 'Agregar pedido al carrito' }}
  </button>
</template>
