<script>
export default {
  name: 'HomeSellCta'
}
</script>

<template>
  <section class="py-12 relative z-10 bg-accent-soft">
    <div class="max-w-7xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 text-accent-600" aria-hidden="true">
          <svg class="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
          </svg>
        </div>
        <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">Vendé en ProviDent</h2>
        <p class="text-gray-600 mb-6">Publicá tus productos o servicios y llegá a profesionales de todo el país.</p>
        <RouterLink to="/seller-setup"
          class="inline-block px-6 py-3 text-white font-semibold rounded-lg shadow-sm transition bg-accent-700 hover:bg-accent-800">
          Empezar a vender
        </RouterLink>
      </div>
    </div>
  </section>
</template>
