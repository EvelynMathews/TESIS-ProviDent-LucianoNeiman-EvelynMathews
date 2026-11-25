<script>
import ServiceCard from '../ServiceCard.vue'
import LoadingSpinner from '../LoadingSpinner.vue'
import { listActiveServices } from '../../services/products'

export default {
  name: 'HomeFeaturedServices',
  components: { ServiceCard, LoadingSpinner },
  data() {
    return {
      services: [],
      loading: false
    }
  },
  methods: {
    async load() {
      try {
        this.loading = true
        const allServices = await listActiveServices()
        this.services = allServices.slice(0, 4)
      } catch (error) {
        console.error('Error cargando servicios:', error)
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.load()
  }
}
</script>

<template>
  <section class="py-12 bg-white relative z-10">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 class="font-heading text-2xl font-bold mb-1 text-secondary-700">Servicios profesionales</h2>
          <p class="text-gray-600">Prótesis, modelado en yeso y alquiler de equipos</p>
        </div>
        <RouterLink :to="{ path: '/productos', query: { tipo: 'servicios' } }"
          class="shrink-0 font-semibold text-secondary-700 hover:underline underline-offset-4">
          Ver todos
        </RouterLink>
      </div>

      <LoadingSpinner v-if="loading" message="Cargando servicios..." />

      <p v-else-if="!services.length" class="text-gray-600 bg-gray-50 rounded-xl p-6 text-center">
        Todavía no hay servicios publicados.
      </p>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <ServiceCard
          v-for="service in services"
          :key="service.id"
          :service="service"
        />
      </div>
    </div>
  </section>
</template>
