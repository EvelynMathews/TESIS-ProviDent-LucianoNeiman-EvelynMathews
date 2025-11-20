<!--
 * Componente raíz de la aplicación Vue.
 * Propósito: Determinar el layout principal de la aplicación:
 * un layout estándar (con Navbar y Footer) para las rutas públicas/de usuario,
 * y un layout simple (solo RouterView) para las rutas de administración,
 * permitiendo que el AdminLayout controle su propia navegación.
 * Funcionamiento: Utiliza la propiedad computada `isAdminRoute` para verificar
 * si la ruta actual comienza con '/admin' y renderiza condicionalmente la estructura.
 /-->
  
<script>
import Footer from './components/Footer.vue';
import Navbar from './components/Navbar.vue';

export default {
  name: 'App',
  components: { Navbar, Footer },
  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    }
  }
}
</script>

<template>
  <div v-if="isAdminRoute" class="min-h-screen">
    <RouterView />
  </div>
  <div v-else class="min-h-screen bg-gray-50 flex flex-col">
    <header>
      <Navbar />
    </header>
    <main class="flex-1 pt-16">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>