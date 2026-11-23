<script>
/**
 * Propósito: Editar un método de envío desde su propia página (`/metodos-envio/:id`).
 * Función: Muestra el mismo formulario corto que el modal (nombre, precio, demora y provincias).
 * Cómo funciona: `load` trae el método con `getShippingMethod`. Al guardar vuelve a la página
 * de origen (`?returnTo=`) o a Configurar ventas, con un aviso.
 */
import { getShippingMethod } from '../services/shipping'
import { showToast } from '../services/toast'
import ShippingMethodForm from '../components/ShippingMethodForm.vue'
import ShippingIcon from '../components/ShippingIcon.vue'

export default {
  name: 'ShippingMethodEdit',
  components: { ShippingMethodForm, ShippingIcon },
  data() {
    return {
      method: null,
      loading: true,
      loadError: ''
    }
  },
  methods: {
    async load() {
      try {
        this.method = await getShippingMethod(this.$route.params.id)
      } catch (e) {
        console.error('Error al cargar el método de envío:', e)
        this.loadError = 'No pudimos cargar el método de envío. Intentá de nuevo.'
      } finally {
        this.loading = false
      }
    },
    goBack() {
      const ret = this.$route.query.returnTo
      this.$router.push(typeof ret === 'string' && ret.startsWith('/') ? ret : '/seller-setup')
    },
    onSaved() {
      showToast('Método de envío actualizado.')
      this.goBack()
    }
  },
  mounted() { this.load() }
}
</script>

<template>
  <section class="bg-gray-50 min-h-screen pb-16">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
      <button type="button" @click="goBack" class="inline-flex items-center gap-1 mb-4 text-sm font-semibold text-primary-700 hover:underline">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      <p v-if="loading" class="text-gray-600" role="status">Cargando…</p>

      <p v-else-if="loadError" class="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800" role="alert">{{ loadError }}</p>

      <div v-else-if="!method" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-gray-800 font-semibold mb-4">No encontramos este método de envío.</p>
        <RouterLink to="/seller-setup" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Ir a mis métodos</RouterLink>
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div class="flex items-center gap-3 mb-6">
          <span class="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
            <ShippingIcon icon="truck" class="w-6 h-6" />
          </span>
          <div>
            <h1 class="font-heading text-2xl font-bold text-gray-800 mb-0">Editar método de envío</h1>
            <p class="text-gray-600 m-0">Contanos cuánto cuesta, cuánto tarda y a dónde llega.</p>
          </div>
        </div>
        <ShippingMethodForm :method="method" submit-text="Guardar cambios" @saved="onSaved" @cancel="goBack" />
      </div>
    </div>
  </section>
</template>
