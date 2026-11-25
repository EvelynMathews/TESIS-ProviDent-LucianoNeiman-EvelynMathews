<script>
import OrganicShapes from './OrganicShapes.vue'
import PlanCard from './PlanCard.vue'

export default {
  name: 'HomePlans',
  components: { OrganicShapes, PlanCard },
  props: {
    loggedIn: { type: Boolean, default: false }
  },
  computed: {
    plans() {
      return [
        {
          name: 'Gratuito',
          price: '$0',
          icon: 'cart',
          cardClass: 'bg-white border-2 border-gray-200',
          iconWrapClass: 'bg-primary-soft/20',
          iconClass: 'text-primary-soft',
          nameClass: 'text-primary-700',
          actionTo: this.loggedIn ? '/seller-setup' : '/register',
          actionLabel: 'Empezar gratis',
          features: [
            { text: 'Publicar hasta ', strong: '3 productos', after: '.' },
            { text: 'Perfil básico ', strong: 'sin prioridad', after: ' en búsquedas.' },
            { text: 'Ideal para ', strong: 'probar', after: ' la plataforma.' }
          ]
        },
        {
          name: 'Profesional',
          price: '$15.000',
          icon: 'cart',
          highlighted: true,
          cardClass: 'bg-linear-135 from-pastel-green-100 to-pastel-green-200',
          nameClass: 'text-secondary-800',
          features: [
            { text: 'Publicaciones ', strong: 'ilimitadas', after: '.' },
            { strong: 'Perfil destacado', after: ' con prioridad de búsquedas.' },
            { text: 'Acceso a ', strong: 'métricas básicas', after: '.' }
          ]
        },
        {
          name: 'Premium',
          price: '$30.000',
          icon: 'clipboard',
          cardClass: 'bg-linear-135 from-pastel-blue-100 to-pastel-blue-200',
          nameClass: 'text-primary-700',
          features: [
            { text: 'Todo lo anterior +' },
            { strong: 'Reputación avanzada', after: ' con reseñas destacadas.' },
            { strong: 'Promociones destacadas', after: ' y cupones.' },
            { text: 'Soporte ', strong: 'prioritario', after: '.' }
          ]
        }
      ]
    }
  }
}
</script>

<template>
  <section class="py-16 relative overflow-hidden bg-surface">
    <OrganicShapes :count="4" />

    <div class="max-w-6xl mx-auto px-4 relative z-10">
      <div class="text-center mb-12">
        <h2 class="font-heading text-3xl font-bold text-gray-800 mb-3">Planes para vendedores</h2>
        <p class="text-lg text-gray-600">Empezá gratis hoy. Los planes pagos se habilitan próximamente.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanCard v-for="plan in plans" :key="plan.name" v-bind="plan" />
      </div>
    </div>
  </section>
</template>
