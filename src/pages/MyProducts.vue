<script>
/**
 * Propósito: Vista para que un usuario con rol de vendedor administre sus publicaciones.
 * Función: Listar todos los productos y servicios propios, y permitir verlos, editarlos, pausarlos/activarlos o eliminarlos.
 * Cómo funciona: `load` usa `listMyProducts`. `toggleActive` cambia `is_active` y `remove` elimina la publicación
 * tras confirmar. Cada acción muestra un aviso con el resultado y el estado de carga se ve en la tarjeta afectada.
 */
import { listMyProducts, updateProduct, deleteProductById } from '../services/products'
import { clearCache } from '../services/cache'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const TYPE_LABELS = {
  SUPPLY: 'Insumo',
  PROSTHESIS: 'Prótesis',
  PLASTER_SERVICE: 'Modelado en yeso',
  RENTAL: 'Alquiler',
}

export default {
  name: 'MyProducts',
  components: {
    LoadingSpinner,
    ConfirmModal
  },
  data() {
    return { items: [], loading: true, error: '', notice: '', busyId: null, filter: 'all', productToDelete: null }
  },
  computed: {
    activeCount() {
      return this.items.filter(p => p.is_active).length
    },
    visibleItems() {
      if (this.filter === 'active') return this.items.filter(p => p.is_active)
      if (this.filter === 'paused') return this.items.filter(p => !p.is_active)
      return this.items
    }
  },
  methods: {
    typeLabel(type) {
      return TYPE_LABELS[type] || ''
    },
    price(p) {
      const fmt = n => new Intl.NumberFormat('es-AR').format(n || 0)
      if (p.product_type === 'PROSTHESIS') return 'Precio según trabajo'
      if (p.product_type === 'RENTAL') return `$${fmt(p.price_day)} /día`
      if (p.product_type === 'PLASTER_SERVICE') return `$${fmt(p.price)} precio base`
      return `$${fmt(p.price)} por ${p.unit || 'unidad'}`
    },
    async load() {
      this.error = ''
      try {
        this.loading = true
        this.items = await listMyProducts()
      } catch (e) {
        this.error = 'No pudimos cargar tus publicaciones. Revisá tu conexión e intentá de nuevo.'
      } finally {
        this.loading = false
      }
    },
    async toggleActive(p) {
      this.notice = ''
      try {
        this.busyId = p.id
        await updateProduct(p.id, { is_active: !p.is_active })
        p.is_active = !p.is_active
        clearCache('products:active')
        clearCache('services:active')
        this.notice = p.is_active ? `“${p.name}” está visible otra vez en el catálogo.` : `“${p.name}” quedó pausada: no aparece en el catálogo.`
      } catch (e) {
        this.notice = 'No pudimos cambiar el estado. Intentá de nuevo.'
      } finally { this.busyId = null }
    },
    async remove() {
      const p = this.productToDelete
      this.productToDelete = null
      this.notice = ''
      try {
        this.busyId = p.id
        await deleteProductById(p.id)
        this.items = this.items.filter(i => i.id !== p.id)
        clearCache('products:active')
        clearCache('services:active')
        this.notice = `“${p.name}” se eliminó.`
      } catch (e) {
        this.notice = 'No pudimos eliminarla. Si tiene pedidos asociados, pausala en lugar de eliminarla.'
      } finally { this.busyId = null }
    },
  },
  mounted() { this.load() }
}
</script>

<template>
  <section class="min-h-screen pb-16 relative overflow-hidden bg-surface">
    <div class="organic-shape organic-shape-1"></div>
    <div class="organic-shape organic-shape-2"></div>
    <div class="organic-shape organic-shape-3"></div>
    <div class="organic-shape organic-shape-4"></div>
    <div class="organic-shape organic-shape-5"></div>
    <div class="organic-shape organic-shape-6"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-1">Mis publicaciones</h1>
          <p v-if="!loading && items.length" class="text-gray-600 m-0">{{ activeCount }} activas de {{ items.length }}</p>
        </div>
        <RouterLink to="/publicar" class="inline-flex items-center gap-2 h-11 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2.5" d="M12 5v14M5 12h14" /></svg>
          Nueva publicación
        </RouterLink>
      </div>

      <p v-if="notice" class="mb-4 px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-800" role="status">{{ notice }}</p>

      <LoadingSpinner v-if="loading" message="Cargando tus publicaciones..." />

      <div v-else-if="error" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
        <p class="text-red-800 font-semibold mb-4">{{ error }}</p>
        <button type="button" @click="load" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
      </div>

      <div v-else-if="items.length === 0" class="bg-white rounded-xl border border-gray-200 text-center py-14 px-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Todavía no publicaste nada</h2>
        <p class="text-gray-600 mb-6">Publicá tu primer insumo o servicio: te lleva unos minutos.</p>
        <RouterLink to="/publicar" class="inline-flex h-11 items-center px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
          Crear publicación
        </RouterLink>
      </div>

      <template v-else>
        <div class="flex gap-2 mb-5" role="group" aria-label="Filtrar publicaciones">
          <button v-for="f in [{ v: 'all', l: 'Todas' }, { v: 'active', l: 'Activas' }, { v: 'paused', l: 'Pausadas' }]" :key="f.v"
            type="button" @click="filter = f.v" :aria-pressed="filter === f.v"
            class="h-9 px-4 rounded-full text-sm font-medium border transition"
            :class="filter === f.v ? 'bg-primary-700 border-primary-700 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-primary-50'">
            {{ f.l }}
          </button>
        </div>

        <p v-if="!visibleItems.length" class="text-gray-600 bg-white rounded-xl border border-gray-200 p-6 text-center">No hay publicaciones en este filtro.</p>

        <ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <li v-for="p in visibleItems" :key="p.id" class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col transition-opacity" :class="{ 'opacity-60': busyId === p.id }">
            <div class="relative aspect-[16/10] bg-gray-100 overflow-hidden">
              <img :src="p.image || '/placeholder-product.svg'" alt="" class="w-full h-full object-cover" :class="{ 'grayscale': !p.is_active }" />
              <span class="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-md"
                :class="p.is_active ? 'bg-secondary-700 text-white' : 'bg-gray-800 text-white'">
                {{ p.is_active ? 'Activa' : 'Pausada' }}
              </span>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <p class="text-xs font-semibold text-secondary-800 mb-0.5">{{ typeLabel(p.product_type) }}</p>
              <h2 class="font-sans text-base font-semibold text-gray-800 mb-1 line-clamp-2">{{ p.name }}</h2>
              <p class="text-sm text-gray-700 font-medium mb-1 tabular-nums">{{ price(p) }}</p>
              <p v-if="p.product_type === 'SUPPLY' && p.stock !== null" class="text-xs m-0" :class="p.stock > 0 ? 'text-gray-600' : 'text-red-700 font-semibold'">
                {{ p.stock > 0 ? `Stock: ${p.stock}` : 'Sin stock' }}
              </p>

              <div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <RouterLink :to="`/productos/${p.id}/editar`" class="h-9 px-4 inline-flex items-center bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-600">Editar</RouterLink>
                <RouterLink :to="`/productos/${p.id}`" class="h-9 px-3 inline-flex items-center text-sm font-semibold text-primary-700 rounded-lg hover:bg-primary-50">Ver</RouterLink>
                <button @click="toggleActive(p)" :disabled="busyId === p.id" type="button"
                  class="h-9 px-3 text-sm font-semibold rounded-lg text-gray-800 hover:bg-gray-100">
                  {{ p.is_active ? 'Pausar' : 'Activar' }}
                </button>
                <button @click="productToDelete = p" :disabled="busyId === p.id" type="button" :aria-label="`Eliminar ${p.name}`"
                  class="ml-auto h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-red-700 hover:bg-red-50">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </div>

    <ConfirmModal v-if="productToDelete"
      title="Confirmar eliminación"
      :message="`¿Estás seguro que querés eliminar “${productToDelete.name}”? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      @confirm="remove"
      @cancel="productToDelete = null" />
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

