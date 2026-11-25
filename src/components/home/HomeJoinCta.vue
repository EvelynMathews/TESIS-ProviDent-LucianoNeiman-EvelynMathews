<script>
export default {
  name: 'HomeJoinCta'
}
</script>

<template>
  <section class="py-12 relative z-10 bg-accent-soft">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <h2 class="font-heading text-3xl font-bold mb-4 text-primary">Unite a la comunidad ProviDent</h2>
      <p class="text-xl mb-8 text-gray-700">
        Accedé a productos, servicios y proveedores de confianza en un solo lugar
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <RouterLink to="/register"
          class="px-8 py-3 text-white font-semibold rounded-lg transition shadow-md hover:opacity-90 bg-primary">
          Crear cuenta
        </RouterLink>
        <RouterLink to="/login"
          class="px-8 py-3 bg-white font-semibold rounded-lg hover:bg-gray-100 transition shadow-md text-primary border-2 border-primary">
          Iniciar sesión
        </RouterLink>
      </div>
    </div>
  </section>
</template>
