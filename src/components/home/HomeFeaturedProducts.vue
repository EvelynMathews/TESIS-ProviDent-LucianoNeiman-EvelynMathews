<script>
import ProductCard from '../ProductCard.vue'
import LoadingSpinner from '../LoadingSpinner.vue'
import OrganicShapes from './OrganicShapes.vue'
import { listActiveProducts } from '../../services/products'

export default {
  name: 'HomeFeaturedProducts',
  components: { ProductCard, LoadingSpinner, OrganicShapes },
  props: {
    loggedIn: { type: Boolean, default: false }
  },
  data() {
    return {
      products: [],
      loading: false
    }
  },
  methods: {
    async load() {
      try {
        this.loading = true
        const allProducts = await listActiveProducts()
        this.products = allProducts.slice(0, 4)
      } catch (error) {
        console.error('Error cargando productos:', error)
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
  <section class="py-12 relative overflow-hidden z-10 bg-accent-wash">
    <OrganicShapes variant="products" :count="5" />

    <div class="max-w-7xl mx-auto px-4 relative z-10">
      <div class="flex items-end justify-between gap-4 mb-6">
        <h2 class="font-heading text-2xl font-bold m-0 text-primary">Productos destacados</h2>
        <RouterLink to="/productos"
          class="shrink-0 font-semibold text-primary-700 hover:underline underline-offset-4">
          Ver todos
        </RouterLink>
      </div>

      <LoadingSpinner v-if="loading" message="Cargando productos..." />

      <p v-else-if="!products.length" class="text-gray-600 bg-white/70 rounded-xl p-6 text-center">
        Todavía no hay productos publicados. <RouterLink :to="loggedIn ? '/seller-setup' : '/register'" class="text-primary-700 font-semibold underline">Publicá el primero</RouterLink>.
      </p>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          :heading-level="3"
        />
      </div>
    </div>
  </section>
</template>
