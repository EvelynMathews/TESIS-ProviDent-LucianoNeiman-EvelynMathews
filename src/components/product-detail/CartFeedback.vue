<script>
export default {
  name: 'CartFeedback',
  props: {
    message: { type: String, default: '' },
    type: { type: String, default: '' },
    needsLogin: { type: Boolean, default: false }
  },
  computed: {
    boxClass() {
      return {
        'bg-secondary-50 border border-secondary-200 text-secondary-800': this.type === 'success',
        'bg-red-50 border border-red-200 text-red-800': this.type === 'error'
      }
    }
  }
}
</script>

<template>
  <div v-if="message" class="mb-6 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3" role="status" aria-live="polite" :class="boxClass">
    <p class="font-semibold m-0">{{ message }}</p>
    <RouterLink v-if="needsLogin" :to="{ path: '/login', query: { redirect: $route.fullPath } }" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600">Iniciar sesión</RouterLink>
    <RouterLink v-else-if="type === 'success'" to="/carrito" class="px-4 py-2 rounded-lg bg-white border border-secondary-300 text-secondary-800 text-sm font-semibold hover:bg-secondary-50">Ver carrito</RouterLink>
  </div>
</template>
