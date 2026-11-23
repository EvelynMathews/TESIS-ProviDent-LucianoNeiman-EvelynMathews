<script>
/**
 * Campos de un insumo (producto con precio por unidad y stock).
 * Recibe el objeto `form` de la página y completa sus campos.
 */
import ProductImageInput from './ProductImageInput.vue'
import { SUPPLY_UNITS, setImage, clearImage } from './listing-form'

export default {
  name: 'SupplyForm',
  components: { ProductImageInput },
  props: {
    form: { type: Object, required: true },
    isNew: { type: Boolean, default: false }
  },
  emits: ['invalid'],
  data() {
    return { units: SUPPLY_UNITS }
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
      <label for="supply-name" class="field-label">Nombre del producto *</label>
      <input id="supply-name" v-model="form.name" type="text" class="field-input" placeholder="Ej: Resina compuesta Universal A2" />
    </div>

    <div>
      <label for="supply-description" class="field-label">Descripción detallada *</label>
      <textarea id="supply-description" v-model="form.description" rows="4" class="field-input"
        placeholder="Describí las características, uso recomendado, contenido del paquete..."></textarea>
    </div>

    <div>
      <label for="supply-image" class="field-label">Imagen{{ isNew ? ' *' : '' }}</label>
      <ProductImageInput input-id="supply-image" :preview="form.imagePreview" :required="isNew" :removable="isNew"
        @select="onImage" @remove="onRemoveImage" @invalid="$emit('invalid', $event)" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="supply-price" class="field-label">Precio unitario *</label>
        <div class="relative">
          <span class="absolute left-4 top-3 text-gray-500">$</span>
          <input id="supply-price" v-model="form.price" type="number" step="0.01" min="0" class="field-input pl-8" placeholder="0.00" />
        </div>
      </div>

      <div>
        <label for="supply-unit" class="field-label">Unidad de medida</label>
        <select id="supply-unit" v-model="form.unit" class="field-input">
          <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
          <option value="otro">Otro...</option>
        </select>
        <input v-if="form.unit === 'otro'" v-model="form.unitCustom" type="text" class="field-input mt-2"
          aria-label="Unidad de medida personalizada" placeholder="Especificá la unidad (ej: frasco, bolsa, kit)" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="supply-stock" class="field-label">Stock disponible *</label>
        <input id="supply-stock" v-model="form.stock" type="number" min="0" class="field-input" placeholder="Cantidad disponible" />
      </div>

      <div>
        <label for="supply-sku" class="field-label">SKU o código interno</label>
        <input id="supply-sku" v-model="form.sku" type="text" class="field-input" placeholder="Ej: PROD-001" />
      </div>
    </div>
  </div>
</template>
