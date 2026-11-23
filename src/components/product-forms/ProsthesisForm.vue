<script>
/**
 * Campos de un servicio de prótesis, con la matriz de precios por tipo de trabajo y grupo dentario.
 * Las combinaciones que no existen en el catálogo (ej: carilla en molar) quedan deshabilitadas.
 */
import ProductImageInput from './ProductImageInput.vue'
import { WORK_TYPES, TOOTH_GROUPS, setImage, clearImage } from './listing-form'
import { loadWorkTypes, loadToothGroups, loadValidWorkGroupCombinations, loadMaterials } from '../../services/products'

export default {
  name: 'ProsthesisForm',
  components: { ProductImageInput },
  props: {
    form: { type: Object, required: true },
    isNew: { type: Boolean, default: false }
  },
  emits: ['invalid'],
  data() {
    return {
      workTypeLabels: WORK_TYPES,
      groupLabels: TOOTH_GROUPS,
      materials: [],
      workTypes: [],
      toothGroups: [],
      validCombinations: []
    }
  },
  methods: {
    onImage(file) { setImage(this.form, file) },
    onRemoveImage() { clearImage(this.form) },
    onMaterialChange() {
      this.form.materialName = this.materials.find(m => m.id === this.form.material)?.name || ''
    },
    findWorkType(key) {
      const words = { corona_total: 'corona', carilla: 'carilla', incrustacion: 'incrusta', puente: 'puente' }
      return this.workTypes.find(wt => wt.name.toLowerCase().includes(words[key]))
    },
    findToothGroup(key) {
      return this.toothGroups.find(tg => {
        const name = tg.name.toLowerCase()
        if (key === 'molar') return name.includes('molar') && !name.includes('premolar')
        return name.includes(key)
      })
    },
    isValidCombination(workTypeKey, groupKey) {
      if (this.validCombinations.length === 0) return true
      const workType = this.findWorkType(workTypeKey)
      const toothGroup = this.findToothGroup(groupKey)
      if (!workType || !toothGroup) return true
      return this.validCombinations.some(c => c.work_type_id === workType.id && c.tooth_group_id === toothGroup.id)
    }
  },
  async mounted() {
    try {
      const [materials, workTypes, toothGroups, combinations] = await Promise.all([
        loadMaterials(), loadWorkTypes(), loadToothGroups(), loadValidWorkGroupCombinations()
      ])
      this.materials = materials
      this.workTypes = workTypes
      this.toothGroups = toothGroups
      this.validCombinations = combinations
    } catch (error) {
      console.error('Error loading catalogs:', error)
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <label for="prosthesis-name" class="field-label">Nombre del servicio *</label>
      <input id="prosthesis-name" v-model="form.name" type="text" class="field-input" placeholder="Ej: Prótesis fijas cerámicas" />
    </div>

    <div>
      <label for="prosthesis-description" class="field-label">Descripción *</label>
      <textarea id="prosthesis-description" v-model="form.description" rows="3" class="field-input"
        placeholder="Describí tu servicio, materiales, garantías..."></textarea>
    </div>

    <div>
      <label for="prosthesis-image" class="field-label">Imagen{{ isNew ? ' *' : '' }}</label>
      <ProductImageInput input-id="prosthesis-image" :preview="form.imagePreview" :required="isNew" :removable="isNew"
        @select="onImage" @remove="onRemoveImage" @invalid="$emit('invalid', $event)" />
    </div>

    <div>
      <label for="prosthesis-material" class="field-label">Material principal *</label>
      <select id="prosthesis-material" v-model="form.material" class="field-input" @change="onMaterialChange">
        <option value="" disabled>Elegí el material</option>
        <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>

    <div>
      <p class="field-label">Matriz de precios (por tipo de trabajo y grupo dentario) *</p>
      <div class="overflow-x-auto">
        <table class="w-full table-fixed border-collapse border border-gray-300 text-sm sm:text-base">
          <thead>
            <tr class="bg-primary-50">
              <th class="w-24 sm:w-auto border border-gray-300 px-2 sm:px-4 py-2 text-left font-semibold text-primary">Tipo de trabajo</th>
              <th v-for="(label, group) in groupLabels" :key="group" class="border border-gray-300 px-1 sm:px-4 py-2 text-center font-semibold text-primary">{{ label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(label, workType) in workTypeLabels" :key="workType">
              <th scope="row" class="border border-gray-300 px-2 sm:px-4 py-2 text-left font-semibold break-words hyphens-auto">{{ label }}</th>
              <td v-for="(groupLabel, group) in groupLabels" :key="group" class="border border-gray-300 p-1 sm:p-2">
                <input v-model="form.pricingMatrix[workType][group]" type="number" step="0.01" min="0"
                  :disabled="!isValidCombination(workType, group)" :aria-label="`${label} ${groupLabel}`"
                  class="matrix-input"
                  placeholder="$" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <label for="prosthesis-delivery" class="field-label">Días de fabricación</label>
      <input id="prosthesis-delivery" v-model="form.deliveryTime" type="number" min="1" class="field-input" placeholder="Ej: 5" />
    </div>
  </div>
</template>
