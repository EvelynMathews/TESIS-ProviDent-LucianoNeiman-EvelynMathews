<script>
/**
 * Vista previa de una publicación antes de confirmarla (paso final de Publicar).
 * `type` es 'supply', 'prosthesis', 'plaster' o 'rental' y `form` son los datos cargados.
 */
import { WORK_TYPES, TOOTH_GROUPS, supplyUnitLabel } from './listing-form'

const BADGES = {
  supply: { text: 'Producto', color: 'bg-primary' },
  prosthesis: { text: 'Servicio: Prótesis', color: 'bg-primary' },
  plaster: { text: 'Servicio: Modelado en Yeso', color: 'bg-secondary' },
  rental: { text: 'Servicio: Alquiler de Equipos', color: 'bg-accent' }
}

export default {
  name: 'ListingPreview',
  props: {
    type: { type: String, required: true },
    form: { type: Object, required: true }
  },
  data() {
    return { workTypeLabels: WORK_TYPES, groupLabels: TOOTH_GROUPS }
  },
  computed: {
    badge() {
      return BADGES[this.type]
    },
    infoTitle() {
      if (this.type === 'supply') return 'Información básica'
      if (this.type === 'rental') return 'Información del equipo'
      return 'Información del servicio'
    },
    unitLabel() {
      return supplyUnitLabel(this.form)
    },
    rentalPrices() {
      return [
        { label: 'Por día', value: this.form.priceDay },
        { label: 'Por semana', value: this.form.priceWeek },
        { label: 'Por mes', value: this.form.priceMonth }
      ].filter(p => p.value)
    },
    rentalGridClass() {
      return ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'][this.rentalPrices.length]
    }
  },
  methods: {
    formatPrice(price) {
      return '$' + new Intl.NumberFormat('es-AR').format(price)
    },
    matrixCell(workType, group) {
      const price = this.form.pricingMatrix[workType][group]
      return price ? this.formatPrice(price) : '-'
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="font-semibold text-gray-700 mb-2">Tipo de publicación</h3>
      <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white" :class="badge.color">{{ badge.text }}</span>
    </div>

    <div v-if="form.imagePreview">
      <h3 class="font-semibold text-gray-700 mb-2">Imagen</h3>
      <div class="grid grid-cols-4 gap-4">
        <img :src="form.imagePreview" alt="Imagen de la publicación" class="w-full h-24 object-cover rounded-lg" />
      </div>
    </div>

    <div>
      <h3 class="font-semibold text-gray-700 mb-2">{{ infoTitle }}</h3>
      <div class="bg-gray-50 rounded-lg p-4 space-y-2">
        <p><span class="font-semibold">Nombre:</span> {{ form.name }}</p>
        <p v-if="type === 'prosthesis'"><span class="font-semibold">Material:</span> {{ form.materialName }}</p>
        <p><span class="font-semibold">Descripción:</span> {{ form.description }}</p>
        <p v-if="type === 'plaster'"><span class="font-semibold">Precio:</span> {{ formatPrice(form.basePrice) }}</p>
        <p v-if="type === 'rental'"><span class="font-semibold">Stock disponible:</span> {{ form.stock }} unidades</p>
        <p v-if="form.deliveryTime"><span class="font-semibold">Días de fabricación:</span> {{ form.deliveryTime }} días</p>
      </div>
    </div>

    <div v-if="type === 'supply'">
      <h3 class="font-semibold text-gray-700 mb-2">Precio y stock</h3>
      <div class="bg-gray-50 rounded-lg p-4 space-y-2">
        <p><span class="font-semibold">Precio:</span> {{ formatPrice(form.price) }} por {{ unitLabel }}</p>
        <p><span class="font-semibold">Stock:</span> {{ form.stock }} unidades</p>
        <p v-if="form.sku"><span class="font-semibold">SKU:</span> {{ form.sku }}</p>
      </div>
    </div>

    <div v-if="type === 'prosthesis'">
      <h3 class="font-semibold text-gray-700 mb-3">Matriz de precios</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-primary-50">
              <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-primary">Tipo de trabajo</th>
              <th v-for="(label, group) in groupLabels" :key="group" class="border border-gray-300 px-4 py-2 text-center font-semibold text-primary">{{ label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(label, workType) in workTypeLabels" :key="workType">
              <th scope="row" class="border border-gray-300 px-4 py-2 text-left font-semibold">{{ label }}</th>
              <td v-for="(groupLabel, group) in groupLabels" :key="group" class="border border-gray-300 px-4 py-2 text-center">
                {{ matrixCell(workType, group) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="type === 'rental'">
      <h3 class="font-semibold text-gray-700 mb-2">Precios de alquiler</h3>
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid gap-4 text-center" :class="rentalGridClass">
          <div v-for="p in rentalPrices" :key="p.label">
            <p class="text-xs text-gray-600 mb-1">{{ p.label }}</p>
            <p class="text-lg font-bold text-accent">{{ formatPrice(p.value) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
