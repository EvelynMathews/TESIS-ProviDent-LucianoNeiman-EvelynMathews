<script>
import CategoryIcon from '../CategoryIcon.vue'
import OrganicShapes from './OrganicShapes.vue'
import { catalogTypes } from '../../data/catalog'

export default {
  name: 'HomeCategories',
  components: { CategoryIcon, OrganicShapes },
  data() {
    return {
      categories: catalogTypes
    }
  }
}
</script>

<template>
  <section class="py-12 relative overflow-hidden z-10 bg-secondary-wash">
    <OrganicShapes variant="category" :count="5" />

    <div class="max-w-7xl mx-auto px-4 relative z-10">
      <h2 class="font-heading text-2xl font-bold mb-6 text-primary">Categorías principales</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RouterLink v-for="category in categories" :key="category.id"
          :to="{ path: '/productos', query: { tipo: category.slug } }"
          class="group bg-white rounded-xl p-4 sm:p-6 text-center border border-primary-100 hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
          <div class="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 p-2.5 rounded-xl bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <CategoryIcon :icon="category.icon" />
          </div>
          <h3 class="font-heading font-semibold text-gray-800 text-base sm:text-lg mb-1">{{ category.name }}</h3>
          <p class="text-xs sm:text-sm text-gray-600 m-0">{{ category.description }}</p>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
