<script>
import { listShippingProfiles, createShippingProfile, updateShippingProfile, countShippingProfileUsage } from '../services/products'
import { isCurrentUserSeller, grantSellerSelf, hasPaymentAccount, connectDummyPaymentAccount } from '../services/sellers'

export default {
  name: 'SellerSetup',
  data() {
    return {
      loading: false,
      checking: false,
      isSeller: false,
      hasPayment: false,
      profiles: [],
      newName: '',
      message: '',
      editingId: null,
      editingName: '',
      warnDisableId: null,
      warnDisableCount: 0,
    }
  },
  methods: {
    async refreshStatus() {
      this.checking = true
      try {
        this.isSeller = await isCurrentUserSeller()
        this.hasPayment = await hasPaymentAccount()
      } finally { this.checking = false }
    },
    async load() {
      try {
        this.loading = true
        this.profiles = await listShippingProfiles()
      } finally { this.loading = false }
    },
    async activateSeller() {
      try {
        await grantSellerSelf()
        await this.refreshStatus()
      } catch {
        this.message = 'No se pudo activar vendedor'
      }
    },
    async connectPayment() {
      try {
        await connectDummyPaymentAccount('MERCADOPAGO')
        await this.refreshStatus()
      } catch {
        this.message = 'No se pudo asociar el método de cobro'
      }
    },
    async createProfile() {
      if (!this.newName.trim()) { this.message = 'Ingresá un nombre para el perfil'; return }
      try {
        const newId = await createShippingProfile(this.newName.trim(), true)
        this.newName = ''
        await this.load()
        this.$router.push(`/perfiles-envio/${newId}`)
        this.message = 'Perfil creado. Ya podés publicar productos.'
      } catch (e) {
        this.message = 'No se pudo crear el perfil'
      }
    },
    startEdit(p) {
      this.editingId = p.id
      this.editingName = p.name
    },
    async saveEdit(p) {
      if (!this.editingName.trim()) { this.message = 'Ingresá un nombre válido'; return }
      try {
        await updateShippingProfile(p.id, { name: this.editingName.trim() })
        this.editingId = null
        this.editingName = ''
        await this.load()
        this.message = 'Perfil actualizado'
      } catch { this.message = 'No se pudo actualizar' }
    },
    cancelEdit() { this.editingId = null; this.editingName = '' },
    async toggleActive(p) {
      if (p.active) {
        // request deactivate: warn if used
        const used = await countShippingProfileUsage(p.id)
        if (used > 0) {
          this.warnDisableId = p.id
          this.warnDisableCount = used
          return
        }
        await updateShippingProfile(p.id, { active: false })
        await this.load()
      } else {
        await updateShippingProfile(p.id, { active: true })
        await this.load()
      }
    },
    async confirmDisable() {
      if (!this.warnDisableId) return
      await updateShippingProfile(this.warnDisableId, { active: false })
      this.warnDisableId = null
      this.warnDisableCount = 0
      await this.load()
    },
    cancelDisable() { this.warnDisableId = null; this.warnDisableCount = 0 },
    goPublish() { this.$router.push('/publicar') }
  },
  async mounted() {
    await this.refreshStatus()
    await this.load()
  }
}
</script>

<template>
  <section class="pt-20 bg-gray-50 min-h-screen pb-12">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Configurar ventas</h1>
        <p class="text-gray-600 mb-6">Asociá tu método de cobro y configurá tus envíos.</p>

        <div v-if="message" class="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-gray-700">{{ message }}</div>

        <div v-if="checking" class="text-gray-600">Verificando estado de vendedor…</div>
        <div v-else class="mb-6 p-4 border rounded bg-gray-50">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="text-gray-800 font-medium">Estado actual</p>
              <p class="text-sm text-gray-600">
                Rol vendedor:
                <span :class="isSeller ? 'text-emerald-700' : 'text-gray-700'">{{ isSeller ? 'Habilitado' : 'Pendiente' }}</span>
                · Método de cobro:
                <span :class="hasPayment ? 'text-emerald-700' : 'text-gray-700'">{{ hasPayment ? 'Asociado' : 'Falta asociar' }}</span>
              </p>
            </div>
            <div class="flex gap-2">
              <button v-if="!isSeller" @click="activateSeller" class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Activar vendedor</button>
              <button v-if="isSeller && !hasPayment" @click="connectPayment" class="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Asociar método de cobro (dummy)</button>
              <router-link v-if="isSeller && hasPayment" to="/publicar" class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Publicar producto</router-link>
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-gray-600">Cargando…</div>

        <div v-else>
          <div v-if="!(isSeller && hasPayment)" class="mb-6 p-4 border rounded bg-yellow-50 text-yellow-800">
            Para configurar envíos primero activá tu cuenta de vendedor y asociá un método de cobro.
          </div>

          <div v-if="profiles.length === 0" class="mb-6">
            <p class="text-gray-700 mb-3">Aún no tenés perfiles de envío.</p>
            <div class="flex gap-2">
              <input v-model="newName" type="text" placeholder="Nombre del perfil (ej: Envío estándar)"
                     class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <button @click="createProfile" :disabled="!(isSeller && hasPayment)"
                      class="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700">Crear</button>
            </div>
          </div>

          <div v-else class="mb-6">
            <h2 class="font-semibold text-gray-800 mb-3">Tus perfiles de envío</h2>
            <div class="space-y-3">
              <div v-for="p in profiles" :key="p.id" class="p-3 border rounded">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span :class="p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'" class="text-xs px-2 py-1 rounded-full">{{ p.active ? 'Activo' : 'Pausado' }}</span>
                    <span v-if="editingId !== p.id" class="font-semibold text-gray-800">{{ p.name }}</span>
                    <input v-else v-model="editingName" class="px-2 py-1 border rounded" />
                  </div>
                  <div class="flex items-center gap-2">
                    <button v-if="editingId !== p.id" @click="startEdit(p)" class="text-sky-600 text-sm hover:underline">Editar</button>
                    <button v-else @click="saveEdit(p)" class="text-emerald-600 text-sm hover:underline">Guardar</button>
                    <button v-if="editingId === p.id" @click="cancelEdit" class="text-gray-600 text-sm hover:underline">Cancelar</button>
                    <router-link :to="`/perfiles-envio/${p.id}`" class="text-sm px-2 py-1 rounded border border-sky-600 text-sky-700 hover:bg-sky-50">Configurar</router-link>
                    <button @click="toggleActive(p)" class="text-sm px-2 py-1 rounded border" :class="p.active ? 'border-red-600 text-red-600 hover:bg-red-50' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'">
                      {{ p.active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </div>
                <div v-if="warnDisableId === p.id" class="mt-2 p-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-center justify-between">
                  <span>Este perfil está asociado a {{ warnDisableCount }} producto(s). ¿Desactivar igualmente?</span>
                  <div class="flex gap-2">
                    <button @click="confirmDisable" class="px-2 py-1 bg-yellow-600 text-white rounded">Desactivar</button>
                    <button @click="cancelDisable" class="px-2 py-1 border rounded">Cancelar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button @click="goPublish" :disabled="!(isSeller && hasPayment)" class="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              Publicar producto
            </button>
            <router-link to="/mis-productos" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Ver mis productos
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
