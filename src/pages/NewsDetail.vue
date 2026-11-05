<script>
import { getNewsBySlug, getNewsImageUrl } from '../services/news'

export default {
  name: 'NewsDetail',
  data() {
    return {
      news: null,
      imageUrl: null,
      loading: true,
      notFound: false,
      error: null
    }
  },
  methods: {
    async loadNews() {
      try {
        this.loading = true
        this.error = null
        this.notFound = false
        this.imageUrl = null
        const slug = this.$route.params.slug
        this.news = await getNewsBySlug(slug)

        if (!this.news) {
          this.notFound = true
          return
        }
        document.title = `${this.news.title} · ProviDent`

        // cargar imagen principal si existe
        if (this.news.news_images && this.news.news_images.length > 0) {
          const primaryImage = this.news.news_images.find(img => img.is_primary) || this.news.news_images[0]
          this.imageUrl = await getNewsImageUrl(primaryImage.path)
        }
      } catch (err) {
        console.error('Error cargando noticia:', err)
        this.error = 'No pudimos cargar la noticia. Revisá tu conexión e intentá de nuevo.'
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
  <div class="min-h-screen flex flex-col bg-surface">
    <div v-if="loading" class="flex-1 flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando noticia...</p>
      </div>
    </div>

    <div v-else-if="error || notFound" class="flex-1 flex items-center justify-center py-20 px-4">
      <div class="text-center max-w-md" :role="error ? 'alert' : null">
        <h1 class="font-heading text-2xl font-bold text-gray-800 mb-2">{{ notFound ? 'No encontramos esta noticia' : 'Algo salió mal' }}</h1>
        <p class="text-gray-600 mb-6">{{ notFound ? 'Puede que se haya despublicado o que el enlace sea incorrecto.' : error }}</p>
        <div class="flex flex-wrap gap-3 justify-center">
          <button v-if="error" type="button" @click="loadNews" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
          <RouterLink to="/" class="px-5 py-2.5 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50">Volver al inicio</RouterLink>
        </div>
      </div>
    </div>

    <article v-else class="flex-1">
      <div class="relative w-full h-64 md:h-96 overflow-hidden">
        <img
          :src="imageUrl || '/placeholder-news.svg'"
          :alt="news.news_images?.[0]?.alt_text || ''"
          class="news-hero-image"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div class="bg-white rounded-lg shadow-lg p-6 md:p-8 lg:p-12 -mt-20 relative z-10">
          <p class="text-sm text-gray-600 mb-2">
            <time :datetime="news.published_at">{{ formatDate(news.published_at) }}</time>
          </p>

          <h1 class="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-primary">
            {{ news.title }}
          </h1>

          <p class="text-lg md:text-xl text-gray-700 font-medium mb-8 leading-relaxed">
            {{ news.preview }}
          </p>

          <div class="prose prose-lg max-w-prose">
            <div v-html="formatContent(news.content)" class="text-gray-800 text-lg leading-relaxed whitespace-pre-line"></div>
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
