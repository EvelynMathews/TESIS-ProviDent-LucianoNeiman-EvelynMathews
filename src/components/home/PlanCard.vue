<script>
// One seller plan. Each feature is { text, strong, after } so a word can be bold.
export default {
  name: 'PlanCard',
  props: {
    name: { type: String, required: true },
    price: { type: String, required: true },
    features: { type: Array, required: true },
    icon: { type: String, default: 'cart' },
    highlighted: { type: Boolean, default: false },
    cardClass: { type: String, default: '' },
    iconWrapClass: { type: String, default: 'bg-white/40' },
    iconClass: { type: String, default: 'text-gray-700' },
    nameClass: { type: String, default: 'text-primary-700' },
    actionTo: { type: String, default: null },
    actionLabel: { type: String, default: '' }
  },
  computed: {
    cardClasses() {
      return [this.cardClass, { 'transform md:scale-105': this.highlighted }]
    }
  },
  methods: {
    featureClass(index) {
      return index === this.features.length - 1 ? 'mb-4' : 'mb-2'
    }
  }
}
</script>

<template>
  <div class="rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300" :class="cardClasses">
    <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" :class="iconWrapClass">
      <svg class="w-10 h-10" :class="iconClass" fill="currentColor" viewBox="0 0 20 20">
        <path v-if="icon === 'cart'" d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
        <template v-else>
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
          <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
        </template>
      </svg>
    </div>
    <div class="mb-6 flex-1">
      <p v-for="(feature, index) in features" :key="index" class="text-gray-700" :class="featureClass(index)">{{ feature.text }}<strong v-if="feature.strong">{{ feature.strong }}</strong>{{ feature.after }}</p>
    </div>
    <p class="text-sm font-semibold uppercase tracking-wide mb-1" :class="nameClass">{{ name }}</p>
    <p class="text-4xl font-bold mb-6 text-gray-800 tabular-nums">{{ price }}<span class="text-lg font-normal text-gray-600">/mes</span></p>
    <RouterLink v-if="actionTo" :to="actionTo" class="w-full py-3 px-6 rounded-lg font-semibold transition text-white bg-primary hover:bg-primary-600">
      {{ actionLabel }}
    </RouterLink>
    <p v-else class="w-full py-3 px-6 rounded-lg font-semibold text-gray-700 bg-white/70 border border-gray-300 m-0">
      Próximamente
    </p>
  </div>
</template>
