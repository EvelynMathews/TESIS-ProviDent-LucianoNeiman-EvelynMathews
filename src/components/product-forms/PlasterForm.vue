<script>
/**
 * Campos de un servicio de modelado en yeso (precio base por modelo).
 */
import ProductImageInput from './ProductImageInput.vue'
import { setImage, clearImage } from './listing-form'

export default {
  name: 'PlasterForm',
  components: { ProductImageInput },
  props: {
    form: { type: Object, required: true },
    isNew: { type: Boolean, default: false }
  },
  emits: ['invalid'],
  methods: {
    onImage(file) { setImage(this.form, file) },
    onRemoveImage() { clearImage(this.form) }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <label for="plaster-name" class="field-label">Nombre del servicio *</label>
      <input id="plaster-name" v-model="form.name" type="text" class="field-input" placeholder="Ej: Modelado en yeso tipo III" />
    </div>

    <div>
      <label for="plaster-description" class="field-label">Descripción *</label>
      <textarea id="plaster-description" v-model="form.description" rows="4" class="field-input"
        placeholder="Describí el tipo de modelado, uso de articulador, recorte, etc..."></textarea>
    </div>

    <div>
      <label for="plaster-image" class="field-label">Imagen{{ isNew ? ' *' : '' }}</label>
      <ProductImageInput input-id="plaster-image" :preview="form.imagePreview" :required="isNew" :removable="isNew"
        @select="onImage" @remove="onRemoveImage" @invalid="$emit('invalid', $event)" />
    </div>

    <div>
      <label for="plaster-price" class="field-label">Precio base *</label>
      <div class="relative">
        <span class="absolute left-4 top-3 text-gray-500">$</span>
        <input id="plaster-price" v-model="form.basePrice" type="number" step="0.01" min="0" class="field-input pl-8"
          placeholder="0.00" aria-describedby="plaster-price-hint" />
      </div>
      <p id="plaster-price-hint" class="field-hint">Precio por modelo completo (superior e inferior)</p>
    </div>

    <div>
      <label for="plaster-delivery" class="field-label">Días de fabricación</label>
      <input id="plaster-delivery" v-model="form.deliveryTime" type="number" min="1" class="field-input" placeholder="Ej: 2" />
    </div>
  </div>
</template>
