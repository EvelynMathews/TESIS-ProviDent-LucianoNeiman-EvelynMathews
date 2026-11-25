<script>
import LoadingSpinner from '../LoadingSpinner.vue'
import ClassifiedModal from '../ClassifiedModal.vue'
import ClassifiedCard from './ClassifiedCard.vue'
import { listActiveClassifieds } from '../../services/classifieds'
import { SUPPORT } from '../../config/support'

// Cards cycle through these color variants
const LOOKS = [
  { card: 'bg-white border-2 border-gray-200', icon: 'bg-primary-soft/20 text-primary', button: 'bg-primary text-white', modal: 'bg-linear-135 from-primary-50 to-secondary-soft' },
  { card: 'bg-linear-135 from-pastel-green-100 to-pastel-green-200', icon: 'bg-white/40 text-gray-700', button: 'bg-gray-700 text-white hover:bg-gray-800', modal: 'bg-linear-135 from-pastel-green-100 to-pastel-green-200' },
  { card: 'bg-linear-135 from-pastel-blue-100 to-pastel-blue-200', icon: 'bg-white/40 text-gray-700', button: 'bg-white text-gray-700 hover:bg-gray-50', modal: 'bg-linear-135 from-pastel-blue-100 to-pastel-blue-200' }
]

export default {
  name: 'HomeClassifieds',
  components: { LoadingSpinner, ClassifiedModal, ClassifiedCard },
  data() {
    return {
      classifieds: [],
      loading: false,
      error: '',
      selectedAd: null,
      supportEmail: SUPPORT.email
    }
  },
  computed: {
    mailto() {
      return `mailto:${SUPPORT.email}?subject=${encodeURIComponent('Clasificados ProviDent')}`
    }
  },
  methods: {
    async load() {
      try {
        this.loading = true
        this.classifieds = await listActiveClassifieds()
      } catch (error) {
        console.error('Error cargando clasificados:', error)
        this.error = 'No se pudieron cargar los avisos. Intentá de nuevo más tarde.'
      } finally {
        this.loading = false
      }
    },
    lookFor(index) {
      return LOOKS[index % LOOKS.length]
    }
  },
  mounted() {
    this.load()
  }
}
</script>

<template>
  <section class="py-16 relative z-10">
    <div class="max-w-6xl mx-auto px-4">
      <div class="bg-paper border border-gray-200 rounded-3xl shadow-sm p-5 sm:p-8 lg:p-10">
        <div class="text-center mb-12">
          <h2 class="font-heading text-3xl font-bold text-gray-800 mb-3">Clasificados</h2>
          <p class="text-lg text-gray-600">Oportunidades laborales en el sector odontológico</p>
        </div>

        <LoadingSpinner v-if="loading" message="Cargando avisos..." />

        <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>

        <p v-else-if="classifieds.length === 0" class="text-center text-gray-500">Por ahora no hay avisos publicados.</p>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ClassifiedCard
            v-for="(ad, index) in classifieds"
            :key="ad.id"
            :ad="ad"
            :look="lookFor(index)"
            @open="selectedAd = { ad, index }"
          />
        </div>

        <div class="mt-10 rounded-2xl p-6 sm:p-8 bg-linear-135 from-primary to-secondary text-white flex flex-col md:flex-row md:items-center gap-6">
          <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-heading text-xl font-bold mb-1">¿Querés publicar tu aviso en Clasificados?</h3>
            <p class="text-white/90 text-sm">
              Escribinos a <strong class="break-all">{{ supportEmail }}</strong> con el asunto
              <strong>“Clasificados ProviDent”</strong> y contanos el puesto que estás buscando cubrir.
            </p>
          </div>
          <a :href="mailto"
            class="w-full md:w-auto text-center px-6 py-3 rounded-lg font-semibold bg-white text-primary hover:bg-gray-50 transition shadow-md flex-shrink-0">
            Enviar email
          </a>
        </div>
      </div>
    </div>

    <ClassifiedModal v-if="selectedAd"
      :ad="selectedAd.ad"
      :accent-class="lookFor(selectedAd.index).modal"
      @close="selectedAd = null" />
  </section>
</template>
