<script>
/**
 * Propósito: Vista para que un usuario con rol de vendedor administre sus publicaciones.
 * Función: Listar todos los productos y servicios propios del usuario, y proporcionar acciones directas como activar/pausar, editar o eliminar publicaciones.
 * Cómo funciona: El método `load` utiliza `listMyProducts` para obtener los ítems del vendedor actual. Los métodos `toggleActive` y `remove` interactúan con el servicio de productos para cambiar el estado de `is_active` o eliminar el registro permanentemente de la base de datos. Muestra un estado de carga y maneja errores.
 */
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
      if (!confirm(`¿Estás seguro que querés eliminar el producto "${p.name}"?`)) return
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
  <section class="pt-20 min-h-screen pb-12 relative overflow-hidden" style="background-color: #F5FEFF;">
    <div class="organic-shape organic-shape-1"></div>
    <div class="organic-shape organic-shape-2"></div>
    <div class="organic-shape organic-shape-3"></div>
    <div class="organic-shape organic-shape-4"></div>
    <div class="organic-shape organic-shape-5"></div>
    <div class="organic-shape organic-shape-6"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Mis productos</h1>
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
              <div class="mt-3 grid grid-cols-2 gap-2">
                <RouterLink :to="`/productos/${p.id}`" class="text-center text-white bg-sky-600 hover:bg-sky-700 rounded-lg py-2">Ver</RouterLink>
                <RouterLink :to="`/productos/${p.id}/editar`" class="text-center text-white bg-sky-600 hover:bg-sky-700 rounded-lg py-2">Editar</RouterLink>
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
.organic-shape {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.6;
    z-index: 0;
}

.organic-shape-1 {
    width: 500px;
    height: 500px;
    background: #A4C5DF;
    top: 100px;
    right: -100px;
    animation: float 20s ease-in-out infinite;
}

.organic-shape-2 {
    width: 700px;
    height: 700px;
    background: #D4F4EC;
    bottom: -200px;
    left: -150px;
    border-radius: 60% 50% 40% 60%;
    animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-3 {
    width: 400px;
    height: 400px;
    background: #F8E8E2;
    top: 50%;
    left: -100px;
    border-radius: 40% 60% 50% 40%;
    animation: float 30s ease-in-out infinite;
}

.organic-shape-4 {
    width: 350px;
    height: 350px;
    background: #E3EEF8;
    top: 30%;
    right: 10%;
    border-radius: 55% 45% 60% 40%;
    animation: float 22s ease-in-out infinite;
}

.organic-shape-5 {
    width: 600px;
    height: 600px;
    background: #A4C5DF;
    bottom: -250px;
    right: -200px;
    border-radius: 45% 55% 40% 60%;
    animation: float 28s ease-in-out infinite reverse;
}

.organic-shape-6 {
    width: 300px;
    height: 300px;
    background: #D4F4EC;
    top: 70%;
    right: -80px;
    border-radius: 50% 50% 45% 55%;
    animation: float 35s ease-in-out infinite;
}

@keyframes float {
    0%, 100% {
        transform: translate(0, 0) rotate(0deg);
    }
    33% {
        transform: translate(30px, -30px) rotate(5deg);
    }
    66% {
        transform: translate(-20px, 20px) rotate(-5deg);
    }
}
</style>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
