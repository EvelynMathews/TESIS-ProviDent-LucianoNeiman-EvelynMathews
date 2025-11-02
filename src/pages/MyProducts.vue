<script>
import { listMyProducts, updateProduct, deleteProductById } from '../services/products'

export default {
  name: 'MyProducts',
  data() {
    return { items: [], loading: false, error: '', busyId: null }
  },
  methods: {
    async load() {
      try {
        this.loading = true
        this.items = await listMyProducts()
      } catch (e) {
        this.error = e?.message || String(e)
      } finally {
        this.loading = false
      }
    },
    async toggleActive(p) {
      try {
        this.busyId = p.id
        await updateProduct(p.id, { is_active: !p.is_active })
        await this.load()
      } catch (e) { this.error = e?.message || String(e) } finally { this.busyId = null }
    },
    async remove(p) {
      if (!confirm('¿Eliminar este producto?')) return
      try {
        this.busyId = p.id
        await deleteProductById(p.id)
        await this.load()
      } catch (e) { this.error = e?.message || String(e) } finally { this.busyId = null }
    },
    goPublish() {
      this.$router.push('/publicar')
    }
  },
  mounted() { this.load() }
}
</script>

<template>
  <section class="pt-20 bg-gray-50 min-h-screen pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Mis Productos</h1>
        <button @click="goPublish" class="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">
          Publicar nuevo
        </button>
      </div>
      <div v-if="loading" class="text-gray-600">Cargando...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else>
        <div v-if="items.length === 0" class="text-gray-600">Aún no cargaste productos.</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="p in items" :key="p.id" class="bg-white border rounded-lg overflow-hidden shadow-sm">
            <img :src="p.image || 'https://placehold.co/600x400?text=Producto'" :alt="p.name" class="w-full h-40 object-cover" />
            <div class="p-4">
              <h3 class="font-semibold text-gray-800 truncate">{{ p.name }}</h3>
              <p class="text-sm text-gray-600 line-clamp-2">{{ p.description }}</p>
              <div class="mt-2 flex items-center justify-between">
                <span class="text-sm text-gray-700">${{ new Intl.NumberFormat('es-AR').format(p.price) }} · {{ p.unit || 'unidad' }}</span>
                <span :class="p.is_active ? 'text-green-600' : 'text-gray-500'" class="text-xs font-semibold">{{ p.is_active ? 'Activo' : 'Pausado' }}</span>
              </div>
              <div class="mt-3 grid grid-cols-3 gap-2">
                <RouterLink :to="`/productos/${p.id}`" class="text-center text-white bg-sky-600 hover:bg-sky-700 rounded-lg py-2">Ver</RouterLink>
                <button @click="toggleActive(p)" :disabled="busyId===p.id"
                        class="text-center rounded-lg py-2 border" :class="p.is_active ? 'border-yellow-600 text-yellow-700 hover:bg-yellow-50' : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'">
                  {{ p.is_active ? 'Pausar' : 'Activar' }}
                </button>
                <button @click="remove(p)" :disabled="busyId===p.id"
                        class="text-center rounded-lg py-2 border border-red-600 text-red-600 hover:bg-red-50">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
