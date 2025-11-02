<script>
import { getShippingProfileById, updateShippingProfile, listProvinces, listShippingZones, createShippingZone, updateShippingZone, deleteShippingZone, listShippingRates, createShippingRate, updateShippingRate, deleteShippingRate } from '../services/products'

export default {
  name: 'ShippingProfileEdit',
  data() {
    return {
      loading: false,
      savingProfile: false,
      profile: null,
      form: { name: '', active: true, volume_min_cm3: '', volume_max_cm3: '' },
      provinces: [],
      zones: [],
      rates: [],
      // zones
      zoneForm: { zone_name: '', province_id: '', postal_code_min: '', postal_code_max: '' },
      editingZoneId: null,
      // rates
      rateForm: { zone_id: '', carrier: '', service: '', price: '', weight_min: '', weight_max: '', volume_min_cm3: '', volume_max_cm3: '', eta_days: '', active: true },
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
        this.profile = await getShippingProfileById(id)
        this.form = {
          name: this.profile.name || '',
          active: !!this.profile.active,
          volume_min_cm3: this.profile.volume_min_cm3 ?? '',
          volume_max_cm3: this.profile.volume_max_cm3 ?? '',
        }
        this.provinces = await listProvinces()
        this.zones = await listShippingZones(id)
        this.rates = await listShippingRates(id)
      } catch (e) { this.error = 'No se pudo cargar el perfil' }
      finally { this.loading = false }
    },
    async saveProfile() {
      if (!this.profile) return
      this.savingProfile = true
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
        await updateShippingProfile(this.profile.id, fields)
        this.message = 'Perfil guardado'
      } catch (e) { this.error = 'No se pudo guardar el perfil' }
      finally { this.savingProfile = false }
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
      if (!this.profile?.id) return
      if (!payload.zone_name || !payload.province_id || !payload.postal_code_min || !payload.postal_code_max) { this.error = 'Completá todos los campos de la zona'; return }
      try {
        if (this.editingZoneId) await updateShippingZone(this.editingZoneId, payload)
        else await createShippingZone(this.profile.id, payload)
        this.resetZoneForm()
        this.zones = await listShippingZones(this.profile.id)
        this.message = 'Zona guardada'
      } catch { this.error = 'No se pudo guardar la zona' }
    },
    async removeZone(z) {
      if (!confirm('¿Eliminar esta zona?')) return
      try {
        await deleteShippingZone(z.id)
        this.zones = await listShippingZones(this.profile.id)
        this.message = 'Zona eliminada'
      } catch { this.error = 'No se pudo eliminar la zona' }
    },
    // rates
    resetRateForm() {
      this.editingRateId = null
      this.rateForm = { zone_id: '', carrier: '', service: '', price: '', weight_min: '', weight_max: '', volume_min_cm3: '', volume_max_cm3: '', eta_days: '', active: true }
    },
    editRate(r) {
      this.editingRateId = r.id
      this.rateForm = {
        zone_id: r.zone_id || '',
        carrier: r.carrier,
        service: r.service,
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
        carrier: (this.rateForm.carrier || '').trim(),
        service: (this.rateForm.service || '').trim(),
        price: this.rateForm.price === '' ? null : Number(this.rateForm.price),
        weight_min: this.rateForm.weight_min === '' ? null : Number(this.rateForm.weight_min),
        weight_max: this.rateForm.weight_max === '' ? null : Number(this.rateForm.weight_max),
        volume_min_cm3: this.rateForm.volume_min_cm3 === '' ? null : Number(this.rateForm.volume_min_cm3),
        volume_max_cm3: this.rateForm.volume_max_cm3 === '' ? null : Number(this.rateForm.volume_max_cm3),
        eta_days: this.rateForm.eta_days === '' ? null : Number(this.rateForm.eta_days),
        active: !!this.rateForm.active,
      }
      if (!this.profile?.id) return
      if (!payload.carrier || !payload.service || payload.price == null) { this.error = 'Completá transportista, servicio y precio'; return }
      try {
        if (this.editingRateId) await updateShippingRate(this.editingRateId, payload)
        else await createShippingRate(this.profile.id, payload)
        this.resetRateForm()
        this.rates = await listShippingRates(this.profile.id)
        this.message = 'Tarifa guardada'
      } catch { this.error = 'No se pudo guardar la tarifa' }
    },
    async removeRate(r) {
      if (!confirm('¿Eliminar esta tarifa?')) return
      try {
        await deleteShippingRate(r.id)
        this.rates = await listShippingRates(this.profile.id)
        this.message = 'Tarifa eliminada'
      } catch { this.error = 'No se pudo eliminar la tarifa' }
    },
    goBack() {
      const ret = this.$route.query.returnTo
      if (ret) this.$router.push(ret)
      else this.$router.push('/seller-setup')
    },
    async saveAndBack() {
      await this.saveProfile()
      this.goBack()
    },
  },
  mounted() { this.loadAll() }
}
</script>

<template>
  <section class="pt-20 bg-gray-50 min-h-screen pb-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-gray-800">Configurar perfil de envío</h1>
        <button @click="goBack" class="px-4 py-2 border rounded">Volver</button>
      </div>

      <div v-if="message" class="mb-4 p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">{{ message }}</div>
      <div v-if="error" class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-800">{{ error }}</div>

      <div v-if="loading" class="text-gray-600">Cargando…</div>
      <div v-else-if="!profile" class="text-gray-600">Perfil no encontrado</div>
      <div v-else class="space-y-8">
        <!-- Perfil -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Datos del perfil</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Nombre del perfil</label>
              <input v-model="form.name" class="w-full px-3 py-2 border rounded" placeholder="Ej: Envío estándar" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Volumen mín. (cm³)</label>
              <input v-model="form.volume_min_cm3" type="number" step="0.01" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Volumen máx. (cm³)</label>
              <input v-model="form.volume_max_cm3" type="number" step="0.01" class="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.active" type="checkbox" /> Activo
            </label>
            <button @click="saveProfile" :disabled="savingProfile" class="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50">Guardar</button>
            <button @click="saveAndBack" :disabled="savingProfile" class="px-4 py-2 border rounded">Guardar y volver</button>
          </div>
        </div>

        <!-- Zonas -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Zonas (provincia y rango de CP)</h2>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Nombre zona</label>
              <input v-model="zoneForm.zone_name" class="w-full px-3 py-2 border rounded" placeholder="Ej: AMBA" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Provincia</label>
              <select v-model="zoneForm.province_id" class="w-full px-3 py-2 border rounded">
                <option value="">Seleccioná…</option>
                <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">CP desde</label>
              <input v-model="zoneForm.postal_code_min" class="w-full px-3 py-2 border rounded" placeholder="1000" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">CP hasta</label>
              <input v-model="zoneForm.postal_code_max" class="w-full px-3 py-2 border rounded" placeholder="1999" />
            </div>
            <div class="flex items-end gap-2">
              <button @click="submitZone" class="px-4 py-2 bg-emerald-600 text-white rounded">{{ editingZoneId ? 'Actualizar' : 'Agregar' }}</button>
              <button v-if="editingZoneId" @click="resetZoneForm" class="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </div>
          <div v-if="zones.length === 0" class="text-sm text-gray-600">No hay zonas definidas.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-gray-600">
              <tr>
                <th class="py-2">Zona</th>
                <th class="py-2">CP desde</th>
                <th class="py-2">CP hasta</th>
                <th class="py-2"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="z in zones" :key="z.id" class="border-t">
                <td class="py-2">{{ z.zone_name }}</td>
                <td class="py-2">{{ z.postal_code_min }}</td>
                <td class="py-2">{{ z.postal_code_max }}</td>
                <td class="py-2 text-right">
                  <button @click="editZone(z)" class="text-sky-600 hover:underline mr-2">Editar</button>
                  <button @click="removeZone(z)" class="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tarifas -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Tarifas (peso y volumen)</h2>
          <div class="grid grid-cols-1 md:grid-cols-9 gap-4 mb-3">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Zona (opcional)</label>
              <select v-model="rateForm.zone_id" class="w-full px-3 py-2 border rounded">
                <option value="">Todas</option>
                <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.zone_name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Transportista</label>
              <input v-model="rateForm.carrier" class="w-full px-3 py-2 border rounded" placeholder="OCA, Andreani…" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Servicio</label>
              <input v-model="rateForm.service" class="w-full px-3 py-2 border rounded" placeholder="Clásico, Prioritario…" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Kg desde</label>
              <input v-model="rateForm.weight_min" type="number" step="0.001" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Kg hasta</label>
              <input v-model="rateForm.weight_max" type="number" step="0.001" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">cm³ desde</label>
              <input v-model="rateForm.volume_min_cm3" type="number" step="0.01" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">cm³ hasta</label>
              <input v-model="rateForm.volume_max_cm3" type="number" step="0.01" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Precio</label>
              <input v-model="rateForm.price" type="number" step="0.01" class="w-full px-3 py-2 border rounded" placeholder="$" />
            </div>
            <div class="flex items-end gap-2">
              <div>
                <label class="block text-sm text-gray-700 mb-1">ETA (días)</label>
                <input v-model="rateForm.eta_days" type="number" class="w-full px-3 py-2 border rounded" />
              </div>
              <div class="flex items-center ml-2 mt-6 gap-2">
                <input v-model="rateForm.active" type="checkbox" />
                <span class="text-sm">Activa</span>
              </div>
              <div class="ml-auto mt-6">
                <button @click="submitRate" class="px-4 py-2 bg-emerald-600 text-white rounded">{{ editingRateId ? 'Actualizar' : 'Agregar' }}</button>
                <button v-if="editingRateId" @click="resetRateForm" class="ml-2 px-4 py-2 border rounded">Cancelar</button>
              </div>
            </div>
          </div>
          <div v-if="rates.length === 0" class="text-sm text-gray-600">No hay tarifas definidas.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-gray-600">
              <tr>
                <th class="py-2">Transportista</th>
                <th class="py-2">Servicio</th>
                <th class="py-2">Peso</th>
                <th class="py-2">Volumen</th>
                <th class="py-2">Precio</th>
                <th class="py-2">ETA</th>
                <th class="py-2">Estado</th>
                <th class="py-2"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="r in rates" :key="r.id" class="border-t">
                <td class="py-2">{{ r.carrier }}</td>
                <td class="py-2">{{ r.service }}</td>
                <td class="py-2">{{ r.weight_min ?? '0' }}–{{ r.weight_max ?? '∞' }} kg</td>
                <td class="py-2">{{ r.volume_min_cm3 ?? '0' }}–{{ r.volume_max_cm3 ?? '∞' }} cm³</td>
                <td class="py-2">${{ r.price }}</td>
                <td class="py-2">{{ r.eta_days ?? '-' }}</td>
                <td class="py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'">{{ r.active ? 'Activa' : 'Pausada' }}</span>
                </td>
                <td class="py-2 text-right">
                  <button @click="editRate(r)" class="text-sky-600 hover:underline mr-2">Editar</button>
                  <button @click="removeRate(r)" class="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
