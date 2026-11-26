<script>
import LoadingSpinner from '../LoadingSpinner.vue'
import { listPublishedNews, getNewsImageUrl } from '../../services/news'
import { formatLongDate } from '../../services/format'

export default {
  name: 'HomeNews',
  components: { LoadingSpinner },
  data() {
    return {
      news: [],
      newsImages: {},
      loading: false
    }
  },
  methods: {
    formatLongDate,
    async load() {
      try {
        this.loading = true
        const allNews = await listPublishedNews()
        this.news = allNews.slice(0, 4)

        for (const newsItem of this.news) {
          if (newsItem.news_images && newsItem.news_images.length > 0) {
            const primaryImage = newsItem.news_images.find(img => img.is_primary) || newsItem.news_images[0]
            this.newsImages[newsItem.id] = await getNewsImageUrl(primaryImage.path)
          }
        }
      } catch (error) {
        console.error('Error cargando noticias:', error)
      } finally {
        this.loading = false
      }
    },
    imageFor(item) {
      return this.newsImages[item.id] || '/placeholder-news.svg'
    },
    onImageError(item) {
      this.newsImages[item.id] = null
    }
  },
  mounted() {
    this.load()
  }
}
</script>

<template>
  <section class="py-12 relative z-10">
    <div class="max-w-7xl mx-auto px-4">
      <h2 class="font-heading text-2xl font-bold mb-6 text-primary">Noticias y Novedades</h2>

      <LoadingSpinner v-if="loading" message="Cargando noticias..." />

      <div v-else-if="news.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RouterLink v-for="item in news" :key="item.id" :to="`/noticias/${item.slug}`"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-card-hover transition block">
          <img
            :src="imageFor(item)"
            :alt="item.news_images?.[0]?.alt_text || ''"
            loading="lazy"
            class="news-card-image"
            @error="onImageError(item)"
          />
          <div class="p-4">
            <h3 class="font-heading font-semibold text-gray-800 mt-2 mb-2 line-clamp-2">{{ item.title }}</h3>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ item.preview }}</p>
            <p class="text-xs text-gray-600 m-0"><time :datetime="item.published_at">{{ formatLongDate(item.published_at) }}</time></p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
