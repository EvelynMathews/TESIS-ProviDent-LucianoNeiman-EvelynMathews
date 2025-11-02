<script>
import { listShippingMethods, createShippingMethod, updateShippingMethod, countShippingMethodUsage } from '../services/products'
import { isCurrentUserSeller, grantSellerSelf, hasPaymentAccount, connectDummyPaymentAccount } from '../services/sellers'

export default {
  name: 'SellerSetup',
  data() {
    return {
      loading: false,
      checking: false,
      isSeller: false,
      hasPayment: false,
      methods: [],
      newName: '',
      message: '',
      editingId: null,
      editingName: '',
      warnDisableId: null,
      warnDisableCount: 0,
      justActivatedSeller: false,
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
        this.methods = await listShippingMethods()
      } finally { this.loading = false }
    },
    async activateSeller() {
      try {
        await grantSellerSelf()
        await this.refreshStatus()
        this.justActivatedSeller = true
        this.message = '¡Cuenta de vendedor activada! Ahora conectá tu cuenta de pago para continuar.'
      } catch {
        this.message = 'No se pudo activar vendedor'
      }
    },
    async connectPayment() {
      try {
        await connectDummyPaymentAccount('MERCADOPAGO')
        await this.refreshStatus()
        this.justActivatedSeller = false
        this.message = '¡Cuenta de pago conectada! Ya podés empezar a vender.'
        // Cargar métodos de envío ahora que tiene cuenta de pago
        await this.load()
      } catch {
        this.message = 'No se pudo asociar el método de cobro'
      }
    },
    async createMethod() {
      if (!this.newName.trim()) { this.message = 'Ingresá un nombre para el método'; return }
      try {
        const newId = await createShippingMethod(this.newName.trim(), true)
        this.newName = ''
        await this.load()
        this.$router.push(`/metodos-envio/${newId}`)
        this.message = 'Método creado. Ya podés publicar productos.'
      } catch (e) {
        this.message = 'No se pudo crear el método'
      }
    },
    startEdit(m) {
      this.editingId = m.id
      this.editingName = m.name
    },
    async saveEdit(m) {
      if (!this.editingName.trim()) { this.message = 'Ingresá un nombre válido'; return }
      try {
        await updateShippingMethod(m.id, { name: this.editingName.trim() })
        this.editingId = null
        this.editingName = ''
        await this.load()
        this.message = 'Método actualizado'
      } catch { this.message = 'No se pudo actualizar' }
    },
    cancelEdit() { this.editingId = null; this.editingName = '' },
    async toggleActive(m) {
      if (m.active) {
        // request deactivate: warn if used
        const used = await countShippingMethodUsage(m.id)
        if (used > 0) {
          this.warnDisableId = m.id
          this.warnDisableCount = used
          return
        }
        await updateShippingMethod(m.id, { active: false })
        await this.load()
      } else {
        await updateShippingMethod(m.id, { active: true })
        await this.load()
      }
    },
    async confirmDisable() {
      if (!this.warnDisableId) return
      await updateShippingMethod(this.warnDisableId, { active: false })
      this.warnDisableId = null
      this.warnDisableCount = 0
      await this.load()
    },
    cancelDisable() { this.warnDisableId = null; this.warnDisableCount = 0 },
    goPublish() { this.$router.push('/publicar') }
  },
  async mounted() {
    await this.refreshStatus()
    // Solo cargar métodos de envío si ya es seller con cuenta de pago
    if (this.isSeller && this.hasPayment) {
      await this.load()
    }
  }
}
</script>

<template>
  <section class="pt-20 bg-gray-50 min-h-screen pb-12">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Configurar ventas</h1>
        <p class="text-gray-600 mb-6">Asociá tu método de cobro y configurá tus envíos.</p>

        <div v-if="message" class="mb-4 p-3 rounded border" :class="justActivatedSeller ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-gray-50 text-gray-700'">
          {{ message }}
        </div>

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
              <button v-if="isSeller && !hasPayment" @click="connectPayment"
                      class="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition"
                      :class="justActivatedSeller ? 'bg-sky-600 hover:bg-sky-700 animate-pulse' : 'bg-sky-600 hover:bg-sky-700'">
                Conectar Cuenta de Pago
              </button>
              <router-link v-if="isSeller && hasPayment" to="/publicar" class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Publicar producto</router-link>
            </div>
          </div>
        </div>

        <!-- Destacar siguiente paso después de activar vendedor -->
        <div v-if="justActivatedSeller && isSeller && !hasPayment" class="mb-6 p-6 border-2 border-sky-500 rounded-lg bg-sky-50">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <svg class="w-12 h-12 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-sky-900 mb-2">Paso siguiente: Conectar tu cuenta de pago</h3>
              <p class="text-sky-800 mb-4">Para poder recibir pagos de tus ventas, necesitás conectar una cuenta de pago. Este es un paso obligatorio para comenzar a vender.</p>
              <button @click="connectPayment" class="px-8 py-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 shadow-lg transform hover:scale-105 transition">
                Conectar Cuenta de Pago Ahora
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-gray-600">Cargando…</div>

        <div v-else>
          <div v-if="!(isSeller && hasPayment)" class="mb-6 p-4 border rounded bg-yellow-50 text-yellow-800">
            Para configurar envíos primero activá tu cuenta de vendedor y asociá un método de cobro.
          </div>

          <div v-if="methods.length === 0" class="mb-6">
            <p class="text-gray-700 mb-3">Aún no tenés métodos de envío.</p>
            <div class="flex gap-2">
              <input v-model="newName" type="text" placeholder="Nombre del método (ej: Envío estándar)"
                     class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <button @click="createMethod" :disabled="!(isSeller && hasPayment)"
                      class="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700">Crear</button>
            </div>
          </div>

          <div v-else class="mb-6">
            <h2 class="font-semibold text-gray-800 mb-3">Tus métodos de envío</h2>
            <div class="space-y-3">
              <div v-for="m in methods" :key="m.id" class="p-3 border rounded">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span :class="m.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'" class="text-xs px-2 py-1 rounded-full">{{ m.active ? 'Activo' : 'Pausado' }}</span>
                    <span v-if="editingId !== m.id" class="font-semibold text-gray-800">{{ m.name }}</span>
                    <input v-else v-model="editingName" class="px-2 py-1 border rounded" />
                  </div>
                  <div class="flex items-center gap-2">
                    <button v-if="editingId !== m.id" @click="startEdit(m)" class="text-sky-600 text-sm hover:underline">Editar</button>
                    <button v-else @click="saveEdit(m)" class="text-emerald-600 text-sm hover:underline">Guardar</button>
                    <button v-if="editingId === m.id" @click="cancelEdit" class="text-gray-600 text-sm hover:underline">Cancelar</button>
                    <router-link :to="`/metodos-envio/${m.id}`" class="text-sm px-2 py-1 rounded border border-sky-600 text-sky-700 hover:bg-sky-50">Configurar</router-link>
                    <button @click="toggleActive(m)" class="text-sm px-2 py-1 rounded border" :class="m.active ? 'border-red-600 text-red-600 hover:bg-red-50' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'">
                      {{ m.active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </div>
                <div v-if="warnDisableId === m.id" class="mt-2 p-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-center justify-between">
                  <span>Este método está asociado a {{ warnDisableCount }} producto(s). ¿Desactivar igualmente?</span>
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
