<script>
import { formatPrice } from '../../services/format'

export default {
  name: 'ProsthesisMatrixTable',
  props: {
    teeth: { type: Array, required: true },
    workTypes: { type: Array, required: true },
    pricingMatrix: { type: Array, default: () => [] },
    validCombinations: { type: Array, default: () => [] },
    selected: { type: Array, required: true },
    stickyFirstColumn: { type: Boolean, default: false }
  },
  emits: ['toggle'],
  computed: {
    firstHeaderClass() {
      return this.stickyFirstColumn ? 'sticky left-0 bg-gray-200' : ''
    },
    firstCellClass() {
      return this.stickyFirstColumn ? 'sticky left-0 bg-white' : ''
    }
  },
  methods: {
    formatPrice,
    isValid(tooth, workTypeId) {
      if (!this.validCombinations || this.validCombinations.length === 0) return true
      return this.validCombinations.some(
        c => c.work_type_id === workTypeId && c.tooth_group_id === tooth.tooth_group_id
      )
    },
    priceFor(tooth, workTypeId) {
      const price = this.pricingMatrix.find(
        p => p.work_type_id === workTypeId && p.tooth_group_id === tooth.tooth_group_id
      )
      return price?.unit_price || 0
    },
    isSelected(toothId, workTypeId) {
      return this.selected.some(c => c.toothId === toothId && c.workTypeId === workTypeId)
    }
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr class="bg-gray-200">
          <th class="border border-gray-300 px-2 py-2 text-left font-semibold" :class="firstHeaderClass">Diente</th>
          <th v-for="wt in workTypes" :key="wt.id"
            class="border border-gray-300 px-2 py-2 text-center font-semibold">
            {{ wt.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tooth in teeth" :key="tooth.id" class="hover:bg-gray-100">
          <td class="border border-gray-300 px-2 py-2 font-medium" :class="firstCellClass">
            {{ tooth.fdi_code }}
          </td>
          <td v-for="wt in workTypes" :key="wt.id"
            class="border border-gray-300 px-2 py-2 text-center">
            <div v-if="isValid(tooth, wt.id)">
              <input
                type="checkbox"
                :aria-label="`Diente ${tooth.fdi_code}, ${wt.name}`"
                :checked="isSelected(tooth.id, wt.id)"
                @change="$emit('toggle', tooth, wt.id, priceFor(tooth, wt.id))"
                class="w-5 h-5 text-primary border-gray-300 rounded cursor-pointer"
              />
              <div class="text-xs text-gray-600 mt-1">
                ${{ formatPrice(priceFor(tooth, wt.id)) }}
              </div>
            </div>
            <span v-else class="text-gray-300 text-xs">-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
