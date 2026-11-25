<script>
import OrganicShapes from './OrganicShapes.vue'

export default {
  name: 'HomeHero',
  components: { OrganicShapes },
  props: {
    loggedIn: { type: Boolean, default: false }
  }
}
</script>

<template>
  <section class="relative py-20 overflow-hidden z-10">
    <OrganicShapes variant="hero" :count="5" />

    <div class="max-w-7xl mx-auto px-4 relative z-10">
      <div class="flex flex-col md:flex-row items-center gap-8">
        <div class="flex-1 text-center md:text-left">
          <h1 class="font-heading text-4xl md:text-5xl font-bold mb-4 text-primary">
            ProviDent
          </h1>
          <p class="text-2xl mb-6 text-primary">
            Conectamos productos odontológicos con quienes lo necesitan
          </p>
          <div class="flex flex-wrap gap-3 justify-center md:justify-start mt-8">
            <RouterLink to="/productos"
              class="px-6 py-3 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90 bg-primary">
              Explorar productos
            </RouterLink>
            <RouterLink v-if="!loggedIn" to="/register"
              class="px-6 py-3 bg-white font-semibold rounded-lg hover:bg-gray-100 transition shadow-md text-primary border-2 border-primary">
              Registrarse
            </RouterLink>
          </div>
        </div>
        <div class="flex-1 hidden md:block">
          <img src="/hero-dentist.webp" fetchpriority="high"
            alt="Profesional odontológico usando ProviDent"
            class="rounded-lg shadow-2xl object-cover w-full h-auto" />
        </div>
      </div>
    </div>
  </section>
</template>
