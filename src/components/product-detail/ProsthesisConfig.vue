<script>
import ProsthesisMatrixTable from './ProsthesisMatrixTable.vue'
import { formatPrice } from './format'

// Variants: A = 'default' (work type + list of teeth), B = 'matrix' (one table), C = 'matrix4' (one table per quadrant)
export default {
  name: 'ProsthesisConfig',
  components: { ProsthesisMatrixTable },
  props: {
    product: { type: Object, required: true },
    workTypes: { type: Array, default: () => [] },
    toothGroups: { type: Array, default: () => [] },
    teeth: { type: Array, default: () => [] },
    validCombinations: { type: Array, default: () => [] },
    mode: { type: String, default: 'default' },
    adding: { type: Boolean, default: false }
  },
  emits: ['add-to-cart'],
  data() {
    return {
      selectedWorkType: null,
      selectedTeethIds: [],
      selectedCombinations: [] // [{ toothId, workTypeId, price }]
    }
  },
  computed: {
    isMatrixMode() {
      return this.mode === 'matrix' || this.mode === 'matrix4'
    },
    selectionCount() {
      return this.isMatrixMode ? this.selectedCombinations.length : this.selectedTeethIds.length
    },
    totalPrice() {
      if (this.isMatrixMode) {
        return this.selectedCombinations.reduce((total, combo) => total + (combo.price || 0), 0)
      }
      return this.selectedTeethIds.reduce((total, toothId) => {
        const tooth = this.availableTeethForWorkType.find(t => t.tooth.id === toothId)
        return total + (tooth?.price || 0)
      }, 0)
    },
    availableTeethForWorkType() {
      if (!this.selectedWorkType) return []
      if (!this.teeth || this.teeth.length === 0) return []

      const groupPrices = {}
      this.product.pricing_matrix.forEach(p => {
        if (p.work_type_id === this.selectedWorkType && p.unit_price > 0) {
          groupPrices[p.tooth_group_id] = p.unit_price
        }
      })

      return this.teeth
        .filter(tooth => groupPrices[tooth.tooth_group_id])
        .map(tooth => {
          const group = this.toothGroups.find(g => g.id === tooth.tooth_group_id)
          return {
            tooth: tooth,
            group_name: group?.name || '',
            price: groupPrices[tooth.tooth_group_id]
          }
        })
    },
    priceSummaryForWorkType() {
      if (!this.selectedWorkType) return []
      if (!this.product.pricing_matrix) return []

      const uniqueGroups = {}
      this.product.pricing_matrix.forEach(p => {
        if (p.work_type_id === this.selectedWorkType) {
          const group = this.toothGroups.find(g => g.id === p.tooth_group_id)
          if (group && !uniqueGroups[p.tooth_group_id]) {
            uniqueGroups[p.tooth_group_id] = {
              groupName: group.name,
              price: p.unit_price
            }
          }
        }
      })
      return Object.values(uniqueGroups)
    },
    teethByQuadrant() {
      if (!this.teeth || this.teeth.length === 0) return {}
      const quadrant = (from, to) => this.teeth
        .filter(t => t.fdi_code >= from && t.fdi_code <= to)
        .sort((a, b) => a.fdi_code - b.fdi_code)
      return {
        1: quadrant(11, 18),
        2: quadrant(21, 28),
        3: quadrant(31, 38),
        4: quadrant(41, 48)
      }
    }
  },
  watch: {
    selectedWorkType() {
      if (!this.isMatrixMode) {
        this.selectedTeethIds = []
      }
    }
  },
  created() {
    if (!this.isMatrixMode && this.workTypes.length > 0) {
      this.selectedWorkType = this.workTypes[0].id
    }
  },
  methods: {
    formatPrice,
    toggleCombination(tooth, workTypeId, price) {
      const index = this.selectedCombinations.findIndex(
        c => c.toothId === tooth.id && c.workTypeId === workTypeId
      )
      if (index >= 0) {
        this.selectedCombinations.splice(index, 1)
      } else {
        this.selectedCombinations.push({ toothId: tooth.id, workTypeId, price })
      }
    },
    // Called by the page before adding to the cart
    cartItem() {
      return {
        price: this.totalPrice,
        quantity: 1,
        typeSpecificData: {
          options_json: {
            workType: this.selectedWorkType,
            teeth: this.selectedTeethIds,
            combinations: this.selectedCombinations,
            mode: this.mode
          }
        }
      }
    }
  }
}
</script>

<template>
  <!-- Variant A -->
  <div v-if="mode === 'default'" class="mb-6 bg-gray-50 p-4 rounded-lg">
    <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Configurá tu pedido</h2>

    <div class="mb-4">
      <label for="work-type" class="field-label">1. Tipo de trabajo</label>
      <select id="work-type" v-model="selectedWorkType" class="field-input">
        <option v-for="wt in workTypes" :key="wt.id" :value="wt.id">
          {{ wt.name }}
        </option>
      </select>
    </div>

    <div v-if="priceSummaryForWorkType.length > 0" class="mb-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-2">Precios por grupo de diente:</h4>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 rounded-lg">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Grupo de Diente</th>
              <th class="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Precio por Pieza</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in priceSummaryForWorkType" :key="item.groupName">
              <td class="border border-gray-300 px-4 py-2 text-sm text-gray-700">{{ item.groupName }}</td>
              <td class="border border-gray-300 px-4 py-2 text-sm text-gray-700 text-right font-semibold">${{ formatPrice(item.price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mb-4">
      <p id="teeth-label" class="field-label">2. Piezas dentales</p>
      <div v-if="!selectedWorkType" class="text-sm text-gray-500 italic">
        Primero seleccioná un tipo de trabajo
      </div>
      <div v-else-if="availableTeethForWorkType.length === 0" class="text-sm text-gray-500 italic">
        No hay piezas disponibles para este tipo de trabajo
      </div>
      <div v-else role="group" aria-labelledby="teeth-label" class="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
        <div v-for="item in availableTeethForWorkType" :key="item.tooth.id"
          class="flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded-md">
          <input
            type="checkbox"
            :id="`tooth-${item.tooth.id}`"
            :value="item.tooth.id"
            v-model="selectedTeethIds"
            class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
          />
          <label :for="`tooth-${item.tooth.id}`" class="flex-1 flex items-center justify-between cursor-pointer">
            <span class="text-sm font-medium text-gray-700">
              Diente {{ item.tooth.fdi_code }} <span class="text-gray-500">({{ item.group_name }})</span>
            </span>
            <span class="text-sm font-semibold text-secondary">
              ${{ formatPrice(item.price) }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-gray-200">
      <p class="text-lg text-gray-700 mb-2">
        Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
      </p>
      <p class="text-sm text-gray-600">{{ selectedTeethIds.length }} {{ selectedTeethIds.length === 1 ? 'pieza seleccionada' : 'piezas seleccionadas' }}</p>
    </div>
  </div>

  <!-- Variant B -->
  <div v-if="mode === 'matrix'" class="mb-6 bg-gray-50 p-4 rounded-lg">
    <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Configurá tu pedido</h2>

    <ProsthesisMatrixTable
      :teeth="teeth"
      :work-types="workTypes"
      :pricing-matrix="product.pricing_matrix"
      :valid-combinations="validCombinations"
      :selected="selectedCombinations"
      sticky-first-column
      @toggle="toggleCombination"
    />

    <div class="pt-4 border-t border-gray-200 mt-4">
      <p class="text-lg text-gray-700 mb-2">
        Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
      </p>
      <p class="text-xs text-gray-500">{{ selectedCombinations.length }} combinación(es) seleccionada(s)</p>
    </div>
  </div>

  <!-- Variant C -->
  <div v-if="mode === 'matrix4'" class="mb-6 bg-gray-50 p-4 rounded-lg">
    <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Configurá tu pedido por cuadrante</h2>

    <div v-for="(quadrantTeeth, quadrant) in teethByQuadrant" :key="quadrant" class="mb-6">
      <h4 class="font-semibold text-gray-700 mb-2">Cuadrante {{ quadrant }}</h4>
      <ProsthesisMatrixTable
        :teeth="quadrantTeeth"
        :work-types="workTypes"
        :pricing-matrix="product.pricing_matrix"
        :valid-combinations="validCombinations"
        :selected="selectedCombinations"
        @toggle="toggleCombination"
      />
    </div>

    <div class="pt-4 border-t border-gray-200">
      <p class="text-lg text-gray-700 mb-2">
        Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
      </p>
      <p class="text-xs text-gray-500">{{ selectedCombinations.length }} combinación(es) seleccionada(s)</p>
    </div>
  </div>

  <slot />

  <button @click="$emit('add-to-cart')"
    type="button"
    :disabled="adding || selectionCount === 0"
    class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
    {{ adding ? 'Agregando…' : 'Agregar pedido al carrito' }}
  </button>
  <p v-if="!selectionCount" class="text-sm text-gray-600 mb-6">
    Elegí al menos una pieza para continuar.
  </p>
</template>
