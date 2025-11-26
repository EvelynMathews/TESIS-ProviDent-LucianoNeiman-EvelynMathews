<script>
import { getNewsBySlug, getNewsImageUrl } from '../services/news'

export default {
  name: 'NewsDetail',
  data() {
    return {
      news: null,
      imageUrl: null,
      loading: true,
      error: null
    }
  },
  methods: {
    async loadNews() {
      try {
        this.loading = true
        const slug = this.$route.params.slug
        this.news = await getNewsBySlug(slug)

        // cargar imagen principal si existe
        if (this.news.news_images && this.news.news_images.length > 0) {
          const primaryImage = this.news.news_images.find(img => img.is_primary) || this.news.news_images[0]
          this.imageUrl = await getNewsImageUrl(primaryImage.path)
        }
      } catch (err) {
        console.error('Error cargando noticia:', err)
        this.error = 'No se pudo cargar la noticia'
      } finally {
        this.loading = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    formatContent(content) {
      return content
    }
  },
  mounted() {
    this.loadNews()
  },
  watch: {
    '$route.params.slug'() {
      this.loadNews()
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: #F5FEFF;">
    <div v-if="loading" class="flex-1 flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando noticia...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center py-20">
      <div class="text-center">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <RouterLink to="/" class="text-primary hover:underline">Volver al inicio</RouterLink>
      </div>
    </div>

    <article v-else class="flex-1">
      <div class="relative w-full h-64 md:h-96 overflow-hidden">
        <img
          :src="imageUrl || 'https://placehold.co/1200x600/2A6FAF/ffffff?text=Noticia'"
          :alt="news.news_images?.[0]?.alt_text || news.title"
          class="news-hero-image"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div class="bg-white rounded-lg shadow-lg p-6 md:p-8 lg:p-12 -mt-20 relative z-10">
          <p class="text-sm text-gray-500 mb-2">
            {{ formatDate(news.published_at) }}
          </p>

          <h1 class="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6" style="color: #2A6FAF;">
            {{ news.title }}
          </h1>

          <p class="text-lg md:text-xl text-gray-700 font-medium mb-8 leading-relaxed">
            {{ news.preview }}
          </p>

          <div class="prose prose-lg max-w-none">
            <div v-html="formatContent(news.content)" class="text-gray-800 leading-relaxed whitespace-pre-line"></div>
          </div>

          <div class="mt-12 pt-6 border-t border-gray-200">
            <RouterLink
              to="/"
              class="inline-flex items-center text-primary hover:underline font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver al inicio
            </RouterLink>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.prose p {
  margin-bottom: 1rem;
}

.prose p:last-child {
  margin-bottom: 0;
}
</style>
