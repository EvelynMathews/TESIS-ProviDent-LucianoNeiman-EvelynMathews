<script>
/**
 * Campos de un alquiler de equipos: unidades disponibles y precio por día, semana o mes.
 */
import ProductImageInput from './ProductImageInput.vue'
import { setImage, clearImage } from './listing-form'

export default {
  name: 'RentalForm',
  components: { ProductImageInput },
  props: {
    form: { type: Object, required: true },
    isNew: { type: Boolean, default: false }
  },
  emits: ['invalid'],
  data() {
    return {
      periods: [
        { key: 'priceDay', label: 'Por día' },
        { key: 'priceWeek', label: 'Por semana' },
        { key: 'priceMonth', label: 'Por mes' }
      ]
    }
  },
  methods: {
    onImage(file) { setImage(this.form, file) },
    onRemoveImage() { clearImage(this.form) }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <label for="rental-name" class="field-label">Nombre del equipo *</label>
      <input id="rental-name" v-model="form.name" type="text" class="field-input" placeholder="Ej: Compresor dental portátil" />
    </div>

    <div>
      <label for="rental-description" class="field-label">Descripción *</label>
      <textarea id="rental-description" v-model="form.description" rows="4" class="field-input"
        placeholder="Describí el equipo, estado, características técnicas..."></textarea>
    </div>

    <div>
      <label for="rental-image" class="field-label">Imagen{{ isNew ? ' *' : '' }}</label>
      <ProductImageInput input-id="rental-image" :preview="form.imagePreview" :required="isNew" :removable="isNew"
        @select="onImage" @remove="onRemoveImage" @invalid="$emit('invalid', $event)" />
    </div>

    <div>
      <label for="rental-stock" class="field-label">Unidades disponibles *</label>
      <input id="rental-stock" v-model="form.stock" type="number" min="1" class="field-input" placeholder="Cantidad de equipos" />
    </div>

    <fieldset>
      <legend class="field-label">Precios de alquiler *</legend>
      <p class="text-xs text-gray-500 mb-3">Completá al menos una opción de precio</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="p in periods" :key="p.key">
          <label :for="`rental-${p.key}`" class="block text-xs text-gray-600 mb-1">{{ p.label }}</label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500">$</span>
            <input :id="`rental-${p.key}`" v-model="form[p.key]" type="number" step="0.01" min="0" class="field-input pl-8" placeholder="0.00" />
          </div>
        </div>
      </div>
    </fieldset>
  </div>
</template>
