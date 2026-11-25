<script>
/**
 * Portada del marketplace. Cada sección es un componente de `components/home/`
 * y las que muestran datos (productos, servicios, noticias, clasificados) los cargan solas.
 * La página solo sigue la sesión para decidir qué llamadas a la acción mostrar.
 */
import { subscribeToAuthStateChanges } from '../services/auth'
import { isCurrentUserSeller } from '../services/sellers'
import OrganicShapes from '../components/home/OrganicShapes.vue'
import HomeHero from '../components/home/HomeHero.vue'
import HomeCategories from '../components/home/HomeCategories.vue'
import HomeAbout from '../components/home/HomeAbout.vue'
import HomeFeaturedProducts from '../components/home/HomeFeaturedProducts.vue'
import HomeFeaturedServices from '../components/home/HomeFeaturedServices.vue'
import HomeSellCta from '../components/home/HomeSellCta.vue'
import HomePlans from '../components/home/HomePlans.vue'
import HomeNews from '../components/home/HomeNews.vue'
import HomeClassifieds from '../components/home/HomeClassifieds.vue'
import HomeJoinCta from '../components/home/HomeJoinCta.vue'

export default {
  name: 'Home',
  components: {
    OrganicShapes,
    HomeHero,
    HomeCategories,
    HomeAbout,
    HomeFeaturedProducts,
    HomeFeaturedServices,
    HomeSellCta,
    HomePlans,
    HomeNews,
    HomeClassifieds,
    HomeJoinCta
  },
  data() {
    return {
      user: {
        id: null,
        email: null,
        username: null,
        avatar_url: null,
      },
      isSeller: false
    }
  },
  computed: {
    loggedIn() {
      return !!this.user.id
    }
  },
  mounted() {
    subscribeToAuthStateChanges(async newUserState => {
      const changed = newUserState.id !== this.user.id
      this.user = newUserState
      if (changed) this.isSeller = newUserState.id ? await isCurrentUserSeller() : false
    })
  }
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden bg-surface">
    <OrganicShapes :count="6" />

    <HomeHero :logged-in="loggedIn" />
    <HomeCategories />
    <HomeAbout :logged-in="loggedIn" />
    <HomeFeaturedProducts :logged-in="loggedIn" />
    <HomeFeaturedServices />
    <HomeSellCta v-if="loggedIn && !isSeller" />
    <HomePlans :logged-in="loggedIn" />
    <HomeNews />
    <HomeClassifieds />
    <HomeJoinCta v-if="!loggedIn" />
  </div>
</template>
