<script>
export default {
  name: 'HomeAbout',
  props: {
    loggedIn: { type: Boolean, default: false }
  }
}
</script>

<template>
  <section class="pt-16 pb-24 bg-white relative z-10">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center gap-12">
        <div class="flex-1">
          <h2 class="font-heading text-3xl font-bold mb-6 text-primary">
            ¿Qué es ProviDent?
          </h2>
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <p>
              <span class="font-semibold">ProviDent nació de la experiencia directa en el rubro odontológico.</span>
              Detectamos un mercado marcado por la informalidad y el boca en boca, donde conseguir insumos
              confiables depende de contactos y llamadas.
            </p>
            <p>
              <span class="font-semibold text-secondary-700">Nuestra oportunidad:</span> centralizar
              y democratizar el acceso a materiales —especialmente materia prima—, fomentando la economía
              local y brindando confianza a profesionales de todo tamaño.
            </p>
            <p>
              Con ProviDent, conectamos proveedores, laboratorios y profesionales en un solo lugar,
              haciendo que el acceso a productos y servicios sea más transparente, seguro y eficiente.
            </p>
          </div>
          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink :to="loggedIn ? '/productos' : '/register'"
              class="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90 bg-secondary-700">
              {{ loggedIn ? 'Ir al catálogo' : 'Crear cuenta gratis' }}
            </RouterLink>
            <RouterLink to="/productos"
              class="px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50 text-primary border-primary">
              Explorar marketplace
            </RouterLink>
          </div>
        </div>
        <div class="flex-1">
          <div class="relative max-h-[28.5rem]">
            <img src="/provident-office.webp" loading="lazy"
              alt="ProviDent - Profesionales trabajando en consultorio odontológico"
              class="rounded-lg shadow-xl w-full object-cover h-[28.5rem]" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
