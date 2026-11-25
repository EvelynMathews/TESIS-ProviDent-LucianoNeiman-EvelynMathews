<script>
export default {
  name: 'ProductSeller',
  props: {
    seller: { type: Object, required: true }
  },
  computed: {
    initials() {
      const name = this.seller?.username
      if (!name) return '?'
      const parts = String(name).trim().split(/\s+/)
      const a = parts[0]?.[0] || ''
      const b = parts[1]?.[0] || ''
      return (a + b).toUpperCase() || a.toUpperCase() || '?'
    },
    profileLink() {
      return `/usuario/${this.seller?.id}`
    }
  }
}
</script>

<template>
  <div class="border-t border-gray-200 pt-6">
    <h2 class="font-heading text-base font-semibold text-gray-800 mb-3">Vendido por</h2>
    <div class="flex items-center gap-3">
      <img v-if="seller?.avatar_url" :src="seller.avatar_url" alt=""
        class="w-12 h-12 rounded-full object-cover" />
      <div v-else class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700">
        {{ initials }}
      </div>
      <div>
        <RouterLink :to="profileLink" class="font-semibold text-gray-800 hover:underline">
          {{ seller.username }}
        </RouterLink>
        <p class="text-sm m-0"><RouterLink :to="profileLink" class="text-primary-700 hover:underline">Ver más publicaciones</RouterLink></p>
        <p v-if="seller.location" class="text-sm text-gray-600">{{ seller.location }}</p>
      </div>
    </div>
  </div>
</template>
