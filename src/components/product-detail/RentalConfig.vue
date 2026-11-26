<script>
import { checkRentalAvailability } from '../../services/rental-availability'
import { formatPrice } from '../../services/format'

const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)

export default {
  name: 'RentalConfig',
  props: {
    product: { type: Object, required: true },
    adding: { type: Boolean, default: false }
  },
  emits: ['add-to-cart'],
  data() {
    return {
      hours: HOURS,
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '18:00',
      errors: {
        startDate: '',
        endDate: '',
        availability: ''
      }
    }
  },
  computed: {
    todayISO() {
      const d = new Date()
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      return d.toISOString().slice(0, 10)
    },
    totalDays() {
      if (!this.startDate || !this.endDate) return 0
      const start = new Date(this.startDate)
      const end = new Date(this.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays + 1
    },
    totalPrice() {
      return this.totalDays * (this.product.daily_price || 0)
    },
    hasDates() {
      return !!this.startDate && !!this.endDate
    }
  },
  methods: {
    formatPrice,
    validateDates() {
      this.errors = { startDate: '', endDate: '', availability: '' }

      if (!this.startDate) {
        this.errors.startDate = 'Selecciona una fecha de inicio'
        return false
      }
      if (!this.endDate) {
        this.errors.endDate = 'Selecciona una fecha de fin'
        return false
      }

      const start = new Date(this.startDate)
      const end = new Date(this.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (start < today) {
        this.errors.startDate = 'La fecha de inicio no puede ser anterior a hoy'
        return false
      }
      if (end < start) {
        this.errors.endDate = 'La fecha de fin debe ser posterior a la de inicio'
        return false
      }

      return true
    },
    async isAvailable() {
      try {
        const result = await checkRentalAvailability(this.product.id, this.startDate, this.endDate)
        return result.available
      } catch (error) {
        console.error('Error checking availability:', error)
        return false
      }
    },
    // Called by the page before adding to the cart; null means invalid or unavailable
    async cartItem() {
      if (!this.validateDates()) return null

      if (!(await this.isAvailable())) {
        this.errors.availability = 'No hay disponibilidad para este período'
        return null
      }

      return {
        price: this.totalPrice,
        quantity: 1,
        typeSpecificData: {
          rental: {
            start_date: this.startDate,
            end_date: this.endDate,
            start_time: this.startTime,
            end_time: this.endTime,
            total_days: this.totalDays,
            calculated_price: this.totalPrice
          }
        }
      }
    },
    reset() {
      this.startDate = ''
      this.endDate = ''
      this.startTime = '09:00'
      this.endTime = '18:00'
    }
  }
}
</script>

<template>
  <div class="mb-6 bg-gray-50 p-4 rounded-lg">
    <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Elegí las fechas</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label for="rental-start" class="field-label">Desde</label>
        <input
          id="rental-start"
          type="date"
          v-model="startDate"
          :min="todayISO"
          :aria-invalid="!!errors.startDate"
          class="field-input"
        />
        <p v-if="errors.startDate" class="field-error" role="alert">{{ errors.startDate }}</p>
      </div>
      <div>
        <label for="rental-end" class="field-label">Hasta</label>
        <input
          id="rental-end"
          type="date"
          v-model="endDate"
          :min="startDate || todayISO"
          :aria-invalid="!!errors.endDate"
          class="field-input"
        />
        <p v-if="errors.endDate" class="field-error" role="alert">{{ errors.endDate }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label for="rental-start-time" class="field-label">Hora de entrega</label>
        <select id="rental-start-time" v-model="startTime" class="field-input">
          <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
        </select>
      </div>
      <div>
        <label for="rental-end-time" class="field-label">Hora de devolución</label>
        <select id="rental-end-time" v-model="endTime" class="field-input">
          <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
        </select>
      </div>
    </div>

    <div v-if="errors.availability" class="mb-4">
      <p class="text-red-700 text-sm font-medium" role="alert">{{ errors.availability }}</p>
    </div>

    <div v-if="product.stock_qty" class="mb-4">
      <p class="text-sm text-gray-600">
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        Unidades disponibles: {{ product.stock_qty }}
      </p>
    </div>

    <div v-if="totalDays > 0" class="pt-4 border-t border-gray-200">
      <p class="text-lg text-gray-700 mb-2">
        Período: <span class="font-semibold">{{ totalDays }} {{ totalDays === 1 ? 'día' : 'días' }}</span>
      </p>
      <p class="text-lg text-gray-700 mb-2">
        Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
      </p>
    </div>
  </div>

  <slot />

  <button @click="$emit('add-to-cart')"
    type="button"
    :disabled="adding || !hasDates || totalDays === 0"
    class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
    {{ adding ?'Verificando disponibilidad…' : 'Agregar alquiler al carrito' }}
  </button>
  <p v-if="!hasDates" class="text-sm text-gray-600 mb-6">
    Elegí fecha de inicio y de fin para ver el total.
  </p>
</template>
