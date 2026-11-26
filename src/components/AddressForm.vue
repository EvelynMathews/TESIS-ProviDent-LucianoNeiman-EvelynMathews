<script>
/**
 * Formulario para cargar o editar un domicilio de entrega.
 * Se usa en Mi perfil (ventana) y en el Checkout. Valida, guarda con `saveAddress`
 * y emite `saved` con el id del domicilio.
 */
import { saveAddress } from '../services/addresses'

export default {
  name: 'AddressForm',
  props: {
    address: { type: Object, default: null },
    provinces: { type: Array, default: () => [] },
    idPrefix: { type: String, default: 'address' },
    submitText: { type: String, default: 'Guardar domicilio' },
    showPrimary: { type: Boolean, default: false },
    canCancel: { type: Boolean, default: true }
  },
  emits: ['saved', 'cancel'],
  data() {
    const a = this.address || {}
    return {
      form: {
        id: a.id || null,
        recipient_name: a.recipient_name || '',
        street: a.street || '',
        city: a.city || '',
        province_id: a.province_id || '',
        postal_code: a.postal_code || '',
        is_primary: !!a.is_primary
      },
      saving: false,
      error: ''
    }
  },
  methods: {
    async submit() {
      const f = this.form
      if (!f.street.trim() || !f.city.trim() || !f.province_id) {
        this.error = 'Completá calle y número, ciudad y provincia.'
        return
      }
      this.saving = true
      this.error = ''
      try {
        const id = await saveAddress(f)
        this.$emit('saved', id)
      } catch (e) {
        console.error('Error saving address:', e)
        this.error = 'No pudimos guardar el domicilio. Intentá de nuevo.'
      } finally {
        this.saving = false
      }
    }
  },
  mounted() {
    this.$refs.firstField?.focus()
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="sm:col-span-2">
        <label :for="`${idPrefix}-street`" class="field-label">Calle y número</label>
        <input :id="`${idPrefix}-street`" ref="firstField" v-model="form.street" type="text" autocomplete="street-address"
          class="field-input" placeholder="Ej: Av. Santa Fe 1234, piso 3" />
      </div>
      <div>
        <label :for="`${idPrefix}-city`" class="field-label">Ciudad</label>
        <input :id="`${idPrefix}-city`" v-model="form.city" type="text" autocomplete="address-level2" class="field-input" />
      </div>
      <div>
        <label :for="`${idPrefix}-province`" class="field-label">Provincia</label>
        <select :id="`${idPrefix}-province`" v-model="form.province_id" class="field-input">
          <option value="" disabled>Elegí una provincia</option>
          <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div>
        <label :for="`${idPrefix}-zip`" class="field-label">Código postal</label>
        <input :id="`${idPrefix}-zip`" v-model="form.postal_code" type="text" inputmode="numeric" autocomplete="postal-code" class="field-input" />
      </div>
      <div>
        <label :for="`${idPrefix}-recipient`" class="field-label">Quién recibe <span class="font-normal text-gray-600">(opcional)</span></label>
        <input :id="`${idPrefix}-recipient`" v-model="form.recipient_name" type="text" autocomplete="name" class="field-input" />
      </div>
    </div>

    <label v-if="showPrimary" class="flex items-center gap-3 text-sm text-gray-800">
      <input v-model="form.is_primary" type="checkbox" class="w-5 h-5 rounded border-gray-300 accent-primary" />
      Usar como domicilio principal
    </label>

    <p v-if="error" class="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2 m-0" role="alert">{{ error }}</p>

    <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
      <button v-if="canCancel" type="button" @click="$emit('cancel')"
        class="h-11 px-5 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
        Cancelar
      </button>
      <button type="submit" :disabled="saving"
        class="h-11 px-5 font-semibold text-white bg-primary rounded-lg hover:bg-primary-600 transition disabled:opacity-60">
        {{ saving ? 'Guardando…' : submitText }}
      </button>
    </div>
  </form>
</template>
