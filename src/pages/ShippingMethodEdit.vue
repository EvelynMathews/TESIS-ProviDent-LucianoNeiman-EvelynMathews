<script>
/**
 * Propósito: Edición detallada de un método de envío específico de un vendedor.
 * Función: Permitir al vendedor configurar los parámetros globales del método (nombre, límites de volumen), y gestionar las zonas (rangos de código postal por provincia) y las tarifas asociadas a peso/volumen para ese método.
 * Cómo funciona: `loadAll` obtiene el método, provincias, zonas y tarifas. `saveMethod` actualiza los parámetros generales. `submitZone` y `submitRate` gestionan las operaciones CRUD (Crear, Leer, Actualizar, Borrar) para la segmentación geográfica y los precios de envío, interactuando con los servicios de `products.js`.
 */
import { getShippingMethodById, updateShippingMethod, listProvinces, listShippingZones, createShippingZone, updateShippingZone, deleteShippingZone, listShippingRates, createShippingRate, updateShippingRate, deleteShippingRate } from '../services/products'

export default {
  name: 'ShippingMethodEdit',
  data() {
    return {
      loading: false,
      savingMethod: false,
      method: null,
      form: { name: '', active: true, volume_min_cm3: '', volume_max_cm3: '' },
      provinces: [],
      zones: [],
      rates: [],
      // zones
      zoneForm: { zone_name: '', province_id: '', postal_code_min: '', postal_code_max: '' },
      editingZoneId: null,
      // rates
      rateForm: { zone_id: '', price: '', weight_min: '', weight_max: '', volume_min_cm3: '', volume_max_cm3: '', eta_days: '', active: true },
      editingRateId: null,
      message: '',
      error: '',
    }
  },
  methods: {
    async loadAll() {
      this.loading = true
      this.error = ''
      try {
        const id = this.$route.params.id
        this.method = await getShippingMethodById(id)
        this.form = {
          name: this.method.name || '',
          active: !!this.method.active,
          volume_min_cm3: this.method.volume_min_cm3 ?? '',
          volume_max_cm3: this.method.volume_max_cm3 ?? '',
        }
        this.provinces = await listProvinces()
        this.zones = await listShippingZones(id)
        this.rates = await listShippingRates(id)
      } catch (e) { this.method = null }
      finally { this.loading = false }
    },
    async saveMethod() {
      if (!this.method) return
      this.savingMethod = true
      this.message = ''
      this.error = ''
      try {
        const fields = {
          name: (this.form.name || '').trim(),
          active: !!this.form.active,
          volume_min_cm3: this.form.volume_min_cm3 === '' ? null : Number(this.form.volume_min_cm3),
          volume_max_cm3: this.form.volume_max_cm3 === '' ? null : Number(this.form.volume_max_cm3),
        }
        if (!fields.name) { this.error = 'El nombre es obligatorio'; return }
        await updateShippingMethod(this.method.id, fields)
        this.message = 'Cambios guardados.'
      } catch (e) { this.error = 'No se pudo guardar el método' }
      finally { this.savingMethod = false }
    },
    // zones
    resetZoneForm() {
      this.editingZoneId = null
      this.zoneForm = { zone_name: '', province_id: '', postal_code_min: '', postal_code_max: '' }
    },
    editZone(z) {
      this.editingZoneId = z.id
      this.zoneForm = { zone_name: z.zone_name, province_id: z.province_id, postal_code_min: z.postal_code_min, postal_code_max: z.postal_code_max }
    },
    async submitZone() {
      this.error = ''
      const payload = {
        zone_name: (this.zoneForm.zone_name || '').trim(),
        province_id: this.zoneForm.province_id,
        postal_code_min: (this.zoneForm.postal_code_min || '').trim(),
        postal_code_max: (this.zoneForm.postal_code_max || '').trim(),
      }
      if (!this.method?.id) return
      if (!payload.zone_name || !payload.province_id || !payload.postal_code_min || !payload.postal_code_max) { this.error = 'Completá todos los campos de la zona'; return }
      try {
        if (this.editingZoneId) await updateShippingZone(this.editingZoneId, payload)
        else await createShippingZone(this.method.id, payload)
        this.resetZoneForm()
        this.zones = await listShippingZones(this.method.id)
        this.message = 'Zona guardada'
      } catch { this.error = 'No se pudo guardar la zona' }
    },
    async removeZone(z) {
      if (!confirm('¿Eliminar esta zona?')) return
      try {
        await deleteShippingZone(z.id)
        this.zones = await listShippingZones(this.method.id)
        this.message = 'Zona eliminada'
      } catch { this.error = 'No se pudo eliminar la zona' }
    },
    // rates
    resetRateForm() {
      this.editingRateId = null
      this.rateForm = { zone_id: '', price: '', weight_min: '', weight_max: '', volume_min_cm3: '', volume_max_cm3: '', eta_days: '', active: true }
    },
    editRate(r) {
      this.editingRateId = r.id
      this.rateForm = {
        zone_id: r.zone_id || '',
        price: r.price,
        weight_min: r.weight_min ?? '',
        weight_max: r.weight_max ?? '',
        volume_min_cm3: r.volume_min_cm3 ?? '',
        volume_max_cm3: r.volume_max_cm3 ?? '',
        eta_days: r.eta_days ?? '',
        active: !!r.active,
      }
    },
    async submitRate() {
      this.error = ''
      const payload = {
        zone_id: this.rateForm.zone_id || null,
        price: this.rateForm.price === '' ? null : Number(this.rateForm.price),
        weight_min: this.rateForm.weight_min === '' ? null : Number(this.rateForm.weight_min),
        weight_max: this.rateForm.weight_max === '' ? null : Number(this.rateForm.weight_max),
        volume_min_cm3: this.rateForm.volume_min_cm3 === '' ? null : Number(this.rateForm.volume_min_cm3),
        volume_max_cm3: this.rateForm.volume_max_cm3 === '' ? null : Number(this.rateForm.volume_max_cm3),
        eta_days: this.rateForm.eta_days === '' ? null : Number(this.rateForm.eta_days),
        active: !!this.rateForm.active,
      }
      if (!this.method?.id) return
      if (payload.price == null) { this.error = 'Ingresá el precio'; return }
      try {
        if (this.editingRateId) await updateShippingRate(this.editingRateId, payload)
        else await createShippingRate(this.method.id, payload)
        this.resetRateForm()
        this.rates = await listShippingRates(this.method.id)
        this.message = 'Tarifa guardada'
      } catch { this.error = 'No se pudo guardar la tarifa' }
    },
    async removeRate(r) {
      if (!confirm('¿Eliminar esta tarifa?')) return
      try {
        await deleteShippingRate(r.id)
        this.rates = await listShippingRates(this.method.id)
        this.message = 'Tarifa eliminada'
      } catch { this.error = 'No se pudo eliminar la tarifa' }
    },
    goBack() {
      const ret = this.$route.query.returnTo
      if (ret) this.$router.push(ret)
      else this.$router.push('/seller-setup')
    },
    async saveAndBack() {
      await this.saveMethod()
      if (!this.error) this.goBack()
    },
  },
  mounted() { this.loadAll() }
}
</script>

<template>
  <section class="bg-gray-50 min-h-screen pb-16">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <button type="button" @click="goBack" class="inline-flex items-center gap-1 mb-4 text-sm font-semibold text-primary-700 hover:underline">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      <h1 class="text-3xl font-bold text-gray-800 mb-1">{{ method?.name || 'Método de envío' }}</h1>
      <p class="text-gray-600 mb-6">Definí dónde entregás (zonas) y cuánto cobrás según peso o volumen (tarifas).</p>

      <p v-if="$route.query.nuevo && !zones.length && !loading" class="mb-4 px-4 py-3 rounded-lg border border-primary-200 bg-primary-50 text-primary-900">
        Método creado. Agregá al menos una zona y una tarifa para que tus compradores vean el costo de envío.
      </p>
      <p v-if="message" class="mb-4 px-4 py-3 rounded-lg border border-secondary-200 bg-secondary-50 text-secondary-800" role="status">{{ message }}</p>
      <p v-if="error" class="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800" role="alert">{{ error }}</p>

      <p v-if="loading" class="text-gray-600" role="status">Cargando…</p>
      <div v-else-if="!method" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-gray-800 font-semibold mb-4">No encontramos este método de envío.</p>
        <RouterLink to="/seller-setup" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Ir a mis métodos</RouterLink>
      </div>

      <div v-else class="space-y-6">
        <!-- Datos del método -->
        <form class="bg-white rounded-2xl border border-gray-200 p-6" @submit.prevent="saveMethod">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Datos generales</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="m-name" class="field-label">Nombre</label>
              <input id="m-name" v-model="form.name" class="field-input" placeholder="Ej: Envío estándar" />
            </div>
            <div>
              <label for="m-vmin" class="field-label">Volumen mínimo (cm³)</label>
              <input id="m-vmin" v-model="form.volume_min_cm3" type="number" min="0" step="0.01" inputmode="decimal" class="field-input" placeholder="Opcional" />
            </div>
            <div>
              <label for="m-vmax" class="field-label">Volumen máximo (cm³)</label>
              <input id="m-vmax" v-model="form.volume_max_cm3" type="number" min="0" step="0.01" inputmode="decimal" class="field-input" placeholder="Opcional" />
            </div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <label class="inline-flex items-center gap-2 text-sm text-gray-800">
              <input v-model="form.active" type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary" />
              Método activo
            </label>
            <div class="ml-auto flex gap-2">
              <button type="submit" :disabled="savingMethod" class="h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-60">
                {{ savingMethod ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </form>

        <!-- Zonas -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-1">Zonas de entrega</h2>
          <p class="text-sm text-gray-600 mb-4">Cada zona es una provincia y un rango de códigos postales.</p>

          <form class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 mb-5" @submit.prevent="submitZone">
            <div>
              <label for="z-name" class="field-label">Nombre de la zona</label>
              <input id="z-name" v-model="zoneForm.zone_name" class="field-input" placeholder="Ej: AMBA" />
            </div>
            <div>
              <label for="z-prov" class="field-label">Provincia</label>
              <select id="z-prov" v-model="zoneForm.province_id" class="field-input">
                <option value="">Elegí una…</option>
                <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label for="z-cpmin" class="field-label">CP desde</label>
              <input id="z-cpmin" v-model="zoneForm.postal_code_min" inputmode="numeric" class="field-input" placeholder="1000" />
            </div>
            <div>
              <label for="z-cpmax" class="field-label">CP hasta</label>
              <input id="z-cpmax" v-model="zoneForm.postal_code_max" inputmode="numeric" class="field-input" placeholder="1999" />
            </div>
            <div class="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end">
              <button v-if="editingZoneId" type="button" @click="resetZoneForm" class="h-11 px-4 border border-gray-300 font-semibold rounded-lg hover:bg-white">Cancelar</button>
              <button type="submit" class="h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">{{ editingZoneId ? 'Guardar zona' : 'Agregar zona' }}</button>
            </div>
          </form>

          <p v-if="zones.length === 0" class="text-sm text-gray-600 m-0">Todavía no agregaste zonas.</p>
          <div v-else class="overflow-x-auto -mx-2">
            <table class="min-w-full text-sm">
              <caption class="sr-only">Zonas de entrega</caption>
              <thead class="text-left text-gray-600 border-b border-gray-200">
                <tr>
                  <th scope="col" class="py-2 px-2 font-semibold">Zona</th>
                  <th scope="col" class="py-2 px-2 font-semibold">Provincia</th>
                  <th scope="col" class="py-2 px-2 font-semibold">Códigos postales</th>
                  <th scope="col" class="py-2 px-2"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="z in zones" :key="z.id" class="border-b border-gray-100">
                  <td class="py-3 px-2 font-medium text-gray-800">{{ z.zone_name }}</td>
                  <td class="py-3 px-2 text-gray-700">{{ provinces.find(p => p.id === z.province_id)?.name || '—' }}</td>
                  <td class="py-3 px-2 text-gray-700 tabular-nums">{{ z.postal_code_min }} a {{ z.postal_code_max }}</td>
                  <td class="py-3 px-2 text-right whitespace-nowrap">
                    <button type="button" @click="editZone(z)" class="font-semibold text-primary-700 hover:underline mr-3">Editar</button>
                    <button type="button" @click="removeZone(z)" class="font-semibold text-red-700 hover:underline">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tarifas -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-1">Tarifas</h2>
          <p class="text-sm text-gray-600 mb-4">El costo de envío según el peso o volumen del paquete. Dejá en blanco los límites que no apliquen.</p>

          <form class="p-4 rounded-xl bg-gray-50 mb-5 space-y-4" @submit.prevent="submitRate">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label for="r-zone" class="field-label">Zona</label>
                <select id="r-zone" v-model="rateForm.zone_id" class="field-input">
                  <option value="">Todas las zonas</option>
                  <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.zone_name }}</option>
                </select>
              </div>
              <div>
                <label for="r-price" class="field-label">Precio del envío</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" aria-hidden="true">$</span>
                  <input id="r-price" v-model="rateForm.price" type="number" min="0" step="0.01" inputmode="decimal" class="field-input pl-8" placeholder="0" />
                </div>
              </div>
              <div>
                <label for="r-eta" class="field-label">Demora (días)</label>
                <input id="r-eta" v-model="rateForm.eta_days" type="number" min="0" inputmode="numeric" class="field-input" placeholder="Ej: 3" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <fieldset class="rounded-lg border border-gray-200 bg-white p-3">
                <legend class="px-1 text-sm font-semibold text-gray-700">Peso (kg)</legend>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="r-wmin" class="block text-xs text-gray-600 mb-1">Desde</label>
                    <input id="r-wmin" v-model="rateForm.weight_min" type="number" min="0" step="0.001" inputmode="decimal" class="field-input py-2" placeholder="0" />
                  </div>
                  <div>
                    <label for="r-wmax" class="block text-xs text-gray-600 mb-1">Hasta</label>
                    <input id="r-wmax" v-model="rateForm.weight_max" type="number" min="0" step="0.001" inputmode="decimal" class="field-input py-2" placeholder="Sin límite" />
                  </div>
                </div>
              </fieldset>
              <fieldset class="rounded-lg border border-gray-200 bg-white p-3">
                <legend class="px-1 text-sm font-semibold text-gray-700">Volumen (cm³)</legend>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="r-vmin" class="block text-xs text-gray-600 mb-1">Desde</label>
                    <input id="r-vmin" v-model="rateForm.volume_min_cm3" type="number" min="0" step="0.01" inputmode="decimal" class="field-input py-2" placeholder="0" />
                  </div>
                  <div>
                    <label for="r-vmax" class="block text-xs text-gray-600 mb-1">Hasta</label>
                    <input id="r-vmax" v-model="rateForm.volume_max_cm3" type="number" min="0" step="0.01" inputmode="decimal" class="field-input py-2" placeholder="Sin límite" />
                  </div>
                </div>
              </fieldset>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <label class="inline-flex items-center gap-2 text-sm text-gray-800">
                <input v-model="rateForm.active" type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary" />
                Tarifa activa
              </label>
              <div class="ml-auto flex gap-2">
                <button v-if="editingRateId" type="button" @click="resetRateForm" class="h-11 px-4 border border-gray-300 font-semibold rounded-lg hover:bg-white">Cancelar</button>
                <button type="submit" class="h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">{{ editingRateId ? 'Guardar tarifa' : 'Agregar tarifa' }}</button>
              </div>
            </div>
          </form>

          <p v-if="rates.length === 0" class="text-sm text-gray-600 m-0">Todavía no agregaste tarifas.</p>
          <div v-else class="overflow-x-auto -mx-2">
            <table class="min-w-full text-sm">
              <caption class="sr-only">Tarifas de envío</caption>
              <thead class="text-left text-gray-600 border-b border-gray-200">
                <tr>
                  <th scope="col" class="py-2 px-2 font-semibold">Zona</th>
                  <th scope="col" class="py-2 px-2 font-semibold">Peso</th>
                  <th scope="col" class="py-2 px-2 font-semibold">Volumen</th>
                  <th scope="col" class="py-2 px-2 font-semibold text-right">Precio</th>
                  <th scope="col" class="py-2 px-2 font-semibold">Demora</th>
                  <th scope="col" class="py-2 px-2 font-semibold">Estado</th>
                  <th scope="col" class="py-2 px-2"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rates" :key="r.id" class="border-b border-gray-100">
                  <td class="py-3 px-2 text-gray-800">{{ zones.find(z => z.id === r.zone_id)?.zone_name || 'Todas' }}</td>
                  <td class="py-3 px-2 text-gray-700 tabular-nums whitespace-nowrap">{{ r.weight_min ?? 0 }} – {{ r.weight_max ?? '∞' }} kg</td>
                  <td class="py-3 px-2 text-gray-700 tabular-nums whitespace-nowrap">{{ r.volume_min_cm3 ?? 0 }} – {{ r.volume_max_cm3 ?? '∞' }} cm³</td>
                  <td class="py-3 px-2 text-gray-900 font-semibold tabular-nums text-right">${{ new Intl.NumberFormat('es-AR').format(r.price || 0) }}</td>
                  <td class="py-3 px-2 text-gray-700">{{ r.eta_days != null ? `${r.eta_days} días` : '—' }}</td>
                  <td class="py-3 px-2">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="r.active ? 'bg-secondary-50 text-secondary-800' : 'bg-gray-100 text-gray-700'">{{ r.active ? 'Activa' : 'Pausada' }}</span>
                  </td>
                  <td class="py-3 px-2 text-right whitespace-nowrap">
                    <button type="button" @click="editRate(r)" class="font-semibold text-primary-700 hover:underline mr-3">Editar</button>
                    <button type="button" @click="removeRate(r)" class="font-semibold text-red-700 hover:underline">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="button" @click="saveAndBack" :disabled="savingMethod" class="h-12 px-6 bg-secondary-700 text-white font-semibold rounded-lg hover:bg-secondary-800 disabled:opacity-60">
            Listo, volver
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
