<script>
import { formatDate } from './format'

export default {
  name: 'ClassifiedCard',
  props: {
    ad: { type: Object, required: true },
    // { card, icon, button } classes for the color variant
    look: { type: Object, required: true }
  },
  emits: ['open'],
  methods: { formatDate }
}
</script>

<template>
  <div class="rounded-2xl p-6 flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300" :class="look.card">
    <div class="flex items-start justify-between gap-3 mb-4">
      <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" :class="look.icon">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"></path>
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>
        </svg>
      </div>
      <span v-if="ad.job_type" class="px-3 py-1 text-xs font-semibold rounded-full bg-white/70 text-gray-700 border border-gray-200">
        {{ ad.job_type }}
      </span>
    </div>
    <h3 class="font-heading text-lg font-bold text-gray-800 mb-1">{{ ad.title }}</h3>
    <p class="text-sm font-semibold text-gray-700">{{ ad.company }}</p>
    <p v-if="ad.location" class="text-sm text-gray-600 mb-3">{{ ad.location }}</p>
    <p class="text-sm text-gray-600 mb-4 flex-1">{{ ad.summary }}</p>
    <p class="text-xs text-gray-500 mb-4 flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
      </svg>
      Publicado el {{ formatDate(ad.published_at) }}
    </p>
    <button type="button" @click="$emit('open')"
      class="w-full py-3 px-6 rounded-lg font-semibold transition shadow-md hover:opacity-90"
      :class="look.button">
      Ver aviso
    </button>
  </div>
</template>
