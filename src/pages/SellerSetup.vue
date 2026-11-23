<script>
/**
 * Propósito: Flujo de configuración inicial para un usuario que se convierte en vendedor.
 * Función: Guía al usuario por tres pasos obligatorios: activar el rol de vendedor, conectar una cuenta de cobro
 * y crear al menos un método de envío. Después puede publicar.
 * Cómo funciona: `refreshStatus` verifica el rol (`isSeller`) y la cuenta de cobro (`hasPayment`). `activateSeller` y
 * `connectPayment` invocan los servicios correspondientes. Los métodos de envío se crean y editan en un modal
 * (`ShippingMethodModal`), se pausan (con aviso si los usan publicaciones) y se eliminan con confirmación.
 */
import { listMyShippingMethods, setShippingMethodActive, deleteShippingMethod, shippingSummary } from '../services/shipping'
import { isCurrentUserSeller, grantSellerSelf, hasPaymentAccount, connectDummyPaymentAccount } from '../services/sellers'
import ShippingMethodModal from '../components/ShippingMethodModal.vue'
import ShippingIcon from '../components/ShippingIcon.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

export default {
  name: 'SellerSetup',
  components: { ShippingMethodModal, ShippingIcon, ConfirmModal },
  data() {
    return {
      loading: false,
      checking: true,
      isSeller: false,
      hasPayment: false,
      methods: [],
      message: '',
      messageType: 'success',
      busy: false,
      warnDisableId: null,
      warnDisableCount: 0,
      shippingModal: null,
      methodToDelete: null,
      deleting: false,
    }
  },
  computed: {
    hasShipping() {
      return this.methods.some(m => m.active && m.configured)
    },
    steps() {
      return [
        { n: 1, title: 'Activar cuenta de vendedor', done: this.isSeller },
        { n: 2, title: 'Conectar cuenta de cobro', done: this.hasPayment },
        { n: 3, title: 'Crear un método de envío', done: this.hasShipping },
      ]
    },
    currentStep() {
      const next = this.steps.find(s => !s.done)
      return next ? next.n : 4
    },
    ready() {
      return this.isSeller && this.hasPayment
    }
  },
  methods: {
    notify(text, type = 'success') {
      this.message = text
      this.messageType = type
    },
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
        this.methods = await listMyShippingMethods()
      } catch {
        this.notify('No pudimos cargar tus métodos de envío.', 'error')
      } finally { this.loading = false }
    },
    async activateSeller() {
      this.busy = true
      try {
        await grantSellerSelf()
        await this.refreshStatus()
        window.dispatchEvent(new Event('seller:changed'))
        this.notify('Listo, tu cuenta de vendedor está activa. Ahora conectá tu cuenta de cobro.')
      } catch {
        this.notify('No pudimos activar tu cuenta de vendedor. Intentá de nuevo.', 'error')
      } finally { this.busy = false }
    },
    async connectPayment() {
      this.busy = true
      try {
        await connectDummyPaymentAccount('MERCADOPAGO')
        await this.refreshStatus()
        await this.load()
        this.notify('Cuenta de cobro conectada. Último paso: creá un método de envío.')
      } catch {
        this.notify('No pudimos conectar la cuenta de cobro. Intentá de nuevo.', 'error')
      } finally { this.busy = false }
    },
    summary(m) {
      return shippingSummary(m)
    },
    async onShippingSaved() {
      const isNew = !this.shippingModal?.method
      await this.load()
      this.shippingModal = null
      this.notify(isNew ? 'Método de envío creado.' : 'Método de envío actualizado.')
    },
    async toggleActive(m) {
      try {
        if (m.active && m.products_count > 0) {
          this.warnDisableId = m.id
          this.warnDisableCount = m.products_count
          return
        }
        await setShippingMethodActive(m.id, !m.active)
        await this.load()
      } catch { this.notify('No pudimos cambiar el estado del método.', 'error') }
    },
    async confirmDisable() {
      if (!this.warnDisableId) return
      try {
        await setShippingMethodActive(this.warnDisableId, false)
        await this.load()
      } catch { this.notify('No pudimos pausar el método.', 'error') }
      this.cancelDisable()
    },
    cancelDisable() { this.warnDisableId = null; this.warnDisableCount = 0 },
    deleteMessage(m) {
      const base = `¿Eliminar "${m.name}"? Esta acción no se puede deshacer.`
      if (!m.products_count) return base
      const pubs = m.products_count === 1 ? '1 publicación lo usa y va' : `${m.products_count} publicaciones lo usan y van`
      return `${base} ${pubs} a quedar sin este método de envío.`
    },
    async confirmDelete() {
      const m = this.methodToDelete
      this.deleting = true
      try {
        await deleteShippingMethod(m.id)
        this.notify(`"${m.name}" se eliminó.`)
        await this.load()
      } catch {
        this.notify('No pudimos eliminar el método. Intentá de nuevo.', 'error')
      } finally {
        this.deleting = false
        this.methodToDelete = null
      }
    },
  },
  async mounted() {
    await this.refreshStatus()
    if (this.isSeller && this.hasPayment) {
      await this.load()
    }
  }
}
</script>

<template>
  <section class="bg-gray-50 min-h-screen pb-16">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-1">Configurar ventas</h1>
      <p class="text-gray-600 mb-6">Tres pasos y ya podés publicar.</p>

      <p v-if="message" class="mb-6 px-4 py-3 rounded-lg border" role="status"
        :class="messageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-secondary-200 bg-secondary-50 text-secondary-800'">
        {{ message }}
      </p>

      <p v-if="checking" class="text-gray-600" role="status">Verificando tu cuenta…</p>

      <template v-else>
        <!-- Progreso -->
        <ol class="grid grid-cols-3 gap-2 mb-8" aria-label="Pasos para empezar a vender">
          <li v-for="s in steps" :key="s.n" class="flex flex-col gap-2">
            <span class="h-1.5 rounded-full" :class="s.done ? 'bg-secondary-600' : (currentStep === s.n ? 'bg-primary' : 'bg-gray-200')"></span>
            <span class="text-xs sm:text-sm font-medium" :class="s.done ? 'text-secondary-800' : (currentStep === s.n ? 'text-primary-800' : 'text-gray-600')">
              <span class="sr-only">{{ s.done ? 'Completado: ' : (currentStep === s.n ? 'Paso actual: ' : 'Pendiente: ') }}</span>
              {{ s.n }}. {{ s.title }}
            </span>
          </li>
        </ol>

        <!-- Paso 1 -->
        <div class="bg-white rounded-2xl border p-6 mb-4" :class="currentStep === 1 ? 'border-primary-300 shadow-[0_8px_24px_-12px_rgba(18,45,70,0.25)]' : 'border-gray-200'">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 mb-1">1. Activar cuenta de vendedor</h2>
              <p class="text-sm text-gray-600 m-0">Habilita tus herramientas para publicar y gestionar ventas.</p>
            </div>
            <span v-if="isSeller" class="text-sm font-semibold text-secondary-800 whitespace-nowrap inline-flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>Activa</span>
          </div>
          <button v-if="!isSeller" type="button" @click="activateSeller" :disabled="busy"
            class="mt-4 h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-60">
            {{ busy ? 'Activando…' : 'Activar cuenta de vendedor' }}
          </button>
        </div>

        <!-- Paso 2 -->
        <div class="bg-white rounded-2xl border p-6 mb-4" :class="[currentStep === 2 ? 'border-primary-300 shadow-[0_8px_24px_-12px_rgba(18,45,70,0.25)]' : 'border-gray-200', { 'opacity-60': !isSeller }]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 mb-1">2. Conectar cuenta de cobro</h2>
              <p class="text-sm text-gray-600 m-0">Por ahora es una conexión de demostración con Mercado Pago: no se mueve dinero real.</p>
            </div>
            <span v-if="hasPayment" class="text-sm font-semibold text-secondary-800 whitespace-nowrap inline-flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>Conectada</span>
          </div>
          <button v-if="isSeller && !hasPayment" type="button" @click="connectPayment" :disabled="busy"
            class="mt-4 h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-60">
            {{ busy ? 'Conectando…' : 'Conectar Mercado Pago' }}
          </button>
        </div>

        <!-- Paso 3 -->
        <div class="bg-white rounded-2xl border p-6 mb-6" :class="[currentStep === 3 ? 'border-primary-300 shadow-[0_8px_24px_-12px_rgba(18,45,70,0.25)]' : 'border-gray-200', { 'opacity-60': !ready }]">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 mb-1">3. Métodos de envío</h2>
              <p class="text-sm text-gray-600 m-0">Definí cuánto cuesta, cuánto tarda y a qué provincias llega cada envío.</p>
            </div>
            <span v-if="hasShipping" class="text-sm font-semibold text-secondary-800 whitespace-nowrap inline-flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>Listo</span>
          </div>

          <p v-if="!ready" class="text-sm text-gray-600 m-0">Completá los pasos anteriores para configurar envíos.</p>

          <template v-else>
            <p v-if="loading" class="text-gray-600" role="status">Cargando métodos…</p>

            <ul v-else-if="methods.length" class="space-y-3 mb-5">
              <li v-for="m in methods" :key="m.id" class="p-4 border border-gray-200 rounded-xl">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <span class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      :class="m.active ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-500'">
                      <ShippingIcon icon="truck" class="w-5 h-5" />
                    </span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="font-semibold text-gray-800 break-words">{{ m.name }}</span>
                        <span :class="m.active ? 'bg-secondary-50 text-secondary-800' : 'bg-gray-100 text-gray-700'" class="text-xs font-semibold px-2 py-0.5 rounded-full">{{ m.active ? 'Activo' : 'Pausado' }}</span>
                      </div>
                      <p class="text-sm m-0" :class="m.configured ? 'text-gray-600' : 'text-amber-800 font-semibold'">{{ summary(m) }}</p>
                      <p v-if="m.products_count" class="flex items-center gap-1 text-xs text-gray-500 m-0 mt-1">
                        <ShippingIcon icon="package" class="w-3.5 h-3.5" />
                        Lo {{ m.products_count === 1 ? 'usa 1 publicación' : `usan ${m.products_count} publicaciones` }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-1 text-sm font-semibold">
                    <button type="button" @click="shippingModal = { method: m }" class="h-9 px-3 rounded-lg text-primary-700 hover:bg-primary-50">
                      {{ m.configured ? 'Editar' : 'Completar' }}
                    </button>
                    <button type="button" @click="toggleActive(m)" class="h-9 px-3 rounded-lg text-gray-800 hover:bg-gray-100">{{ m.active ? 'Pausar' : 'Activar' }}</button>
                    <button type="button" @click="methodToDelete = m" class="h-9 px-3 rounded-lg text-red-700 hover:bg-red-50">Eliminar</button>
                  </div>
                </div>
                <div v-if="warnDisableId === m.id" class="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex flex-wrap items-center justify-between gap-2" role="alert">
                  <span>Lo usan {{ warnDisableCount }} {{ warnDisableCount === 1 ? 'publicación' : 'publicaciones' }}. Si lo pausás, no se podrá elegir para publicar.</span>
                  <div class="flex gap-2">
                    <button type="button" @click="confirmDisable" class="h-9 px-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800">Pausar igual</button>
                    <button type="button" @click="cancelDisable" class="h-9 px-3 border border-amber-300 font-semibold rounded-lg hover:bg-amber-100">Cancelar</button>
                  </div>
                </div>
              </li>
            </ul>
            <div v-else class="flex items-center gap-3 p-4 mb-5 rounded-xl border border-dashed border-gray-300 text-gray-600">
              <ShippingIcon icon="package" class="w-6 h-6 text-gray-400" />
              <p class="text-sm m-0">Todavía no creaste métodos de envío.</p>
            </div>

            <button type="button" @click="shippingModal = { method: null }"
              class="h-12 px-5 font-semibold rounded-lg transition"
              :class="methods.length ? 'border-2 border-primary text-primary hover:bg-primary-50' : 'bg-primary text-white hover:bg-primary-600'">
              + {{ methods.length ? 'Agregar otro método' : 'Crear método de envío' }}
            </button>
          </template>
        </div>

        <div class="flex flex-wrap gap-3">
          <RouterLink v-if="ready" to="/publicar" class="h-12 px-6 inline-flex items-center bg-secondary-700 text-white font-semibold rounded-lg hover:bg-secondary-800 transition">
            Publicar ahora
          </RouterLink>
          <RouterLink v-if="isSeller" to="/mis-productos" class="h-12 px-6 inline-flex items-center border border-gray-300 rounded-lg text-gray-800 font-semibold hover:bg-white">
            Ver mis publicaciones
          </RouterLink>
        </div>
      </template>
    </div>

    <ShippingMethodModal v-if="shippingModal" :method="shippingModal.method"
      @saved="onShippingSaved" @close="shippingModal = null" />

    <ConfirmModal v-if="methodToDelete"
      title="Eliminar método de envío"
      :message="deleteMessage(methodToDelete)"
      confirm-text="Eliminar"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="methodToDelete = null" />
  </section>
</template>
