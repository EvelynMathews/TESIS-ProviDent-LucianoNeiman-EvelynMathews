<script>
/**
 * Detalle de un producto o servicio del marketplace.
 * La página carga el producto y arma la parte común (imagen, descripción, vendedor).
 * Lo que cambia según el tipo (precio, configuración y botón) vive en `components/product-detail/`:
 * cada componente valida lo suyo y devuelve con `cartItem()` lo que se agrega al carrito.
 */
import { subscribeToAuthStateChanges } from '../services/auth'
import { getProductById, listActiveProducts, loadMaterials, loadWorkTypes, loadToothGroups, loadTeeth, loadValidWorkGroupCombinations } from '../services/products'
import { addToCart as addToCartService } from '../services/cart'
import { showToast } from '../services/toast'
import ProductCard from '../components/ProductCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import CartFeedback from '../components/product-detail/CartFeedback.vue'
import PlasterConfig from '../components/product-detail/PlasterConfig.vue'
import ProductPrice from '../components/product-detail/ProductPrice.vue'
import ProductSeller from '../components/product-detail/ProductSeller.vue'
import ProsthesisConfig from '../components/product-detail/ProsthesisConfig.vue'
import RentalConfig from '../components/product-detail/RentalConfig.vue'
import SupplyPurchase from '../components/product-detail/SupplyPurchase.vue'

const PURCHASE_COMPONENTS = {
  SUPPLY: 'SupplyPurchase',
  PROSTHESIS: 'ProsthesisConfig',
  PLASTER_SERVICE: 'PlasterConfig',
  RENTAL: 'RentalConfig'
}

export default {
  name: 'ProductDetail',
  components: {
    ProductCard,
    LoadingSpinner,
    CartFeedback,
    PlasterConfig,
    ProductPrice,
    ProductSeller,
    ProsthesisConfig,
    RentalConfig,
    SupplyPurchase
  },
  data() {
    return {
      user: {
        id: null,
        email: null,
      },
      product: null,
      loading: true,
      loadError: false,
      addingToCart: false,
      needsLogin: false,
      imageFailed: false,
      relatedProducts: [],
      materials: [],
      workTypes: [],
      toothGroups: [],
      teeth: [],
      validCombinations: [],
      cartMessage: '',
      cartMessageType: ''
    }
  },
  computed: {
    hasRating() {
      return Number(this.product?.seller?.rating) > 0 || Number(this.product?.seller?.sales_count) > 0
    },
    typeLabel() {
      return { SUPPLY: 'Insumo', PROSTHESIS: 'Prótesis por encargo', PLASTER_SERVICE: 'Modelado en yeso', RENTAL: 'Alquiler de equipo' }[this.product?.product_type] || ''
    },
    imageSrc() {
      return (!this.imageFailed && this.product?.image) || '/placeholder-product.svg'
    },
    uiMode() {
      return this.$route.query.ui || 'default'
    },
    priceBlock() {
      const p = this.product
      if (p.product_type === 'SUPPLY') return { amount: p.price, caption: `por ${p.unit || 'unidad'}` }
      if (p.product_type === 'PLASTER_SERVICE') return { amount: p.base_price, caption: 'Precio base' }
      if (p.product_type === 'RENTAL') return { amount: p.daily_price, caption: 'por día', deposit: p.refundable_deposit_amount }
      return null
    },
    purchaseComponent() {
      return PURCHASE_COMPONENTS[this.product.product_type] || null
    },
    purchaseProps() {
      const props = { product: this.product, adding: this.addingToCart }
      if (this.product.product_type === 'PROSTHESIS') {
        Object.assign(props, {
          workTypes: this.workTypes,
          toothGroups: this.toothGroups,
          teeth: this.teeth,
          validCombinations: this.validCombinations,
          mode: this.uiMode
        })
      }
      return props
    }
  },
  methods: {
    async addToCart() {
      if (this.addingToCart) return
      if (this.product.is_active === false) {
        this.cartMessage = 'Esta publicación está pausada y no se puede comprar por ahora.'
        this.cartMessageType = 'error'
        return
      }
      this.cartMessage = ''
      this.cartMessageType = ''
      this.needsLogin = false
      this.addingToCart = true

      try {
        const purchase = this.$refs.purchase
        const item = await purchase.cartItem()
        if (!item) return

        const productData = {
          id: this.product.id,
          product_type: this.product.product_type,
          price: item.price,
          quantity: item.quantity
        }
        const result = await addToCartService(productData, item.typeSpecificData)
        this.needsLogin = !!result.needsAuth

        if (result.success) {
          this.cartMessage = result.message
          this.cartMessageType = 'success'
          showToast(result.message || 'Producto agregado al carrito')
          purchase.reset?.()

          clearTimeout(this._msgTimer)
          this._msgTimer = setTimeout(() => {
            this.cartMessage = ''
          }, 5000)
        } else {
          this.cartMessage = result.message || 'Error al agregar al carrito'
          this.cartMessageType = 'error'
          if (!result.needsAuth) showToast(this.cartMessage, 'error')
        }
      } catch (error) {
        console.error('Error in addToCart:', error)
        this.cartMessage = 'No pudimos agregarlo al carrito. Intentá de nuevo.'
        this.cartMessageType = 'error'
      } finally {
        this.addingToCart = false
      }
    },
    async loadRelatedProducts() {
      try {
        const items = await listActiveProducts()
        const currentId = this.product?.id
        this.relatedProducts = items
          .filter(p => p.id !== currentId && p.product_type === 'SUPPLY')
          .slice(0, 4)
      } catch (e) { console.error(e) }
    },
    async loadProduct() {
      this.loading = true
      this.loadError = false
      this.imageFailed = false
      this.cartMessage = ''
      try {
        const id = this.$route.params.id
        // Un id con formato inválido no puede existir: se evita la consulta (y el error 400)
        const p = /^[0-9a-f-]{36}$/i.test(id) ? await getProductById(id) : null
        this.product = p
        if (!p) {
          this.relatedProducts = []
          return
        }
        document.title = `${p.name} · ProviDent`

        if (p.product_type === 'PROSTHESIS') {
          this.materials = await loadMaterials()
          this.workTypes = await loadWorkTypes()
          this.toothGroups = await loadToothGroups()
          this.teeth = await loadTeeth()
          this.validCombinations = await loadValidWorkGroupCombinations()
        }

        this.loadRelatedProducts()
      } catch (e) {
        // Un id con formato inválido devuelve error de Postgres: se muestra como "no encontrado"
        if (e?.code !== '22P02') {
          console.error('Failed to load product', e)
          this.loadError = true
        }
        this.product = null
      } finally {
        this.loading = false
      }
    }
  },
  watch: {
    '$route.params.id'() {
      this.loadProduct()
    }
  },
  mounted() {
    this.unsubscribe = subscribeToAuthStateChanges(newUserState => {
      this.user = newUserState
    })
    this.loadProduct()
  },
  beforeUnmount() {
    clearTimeout(this._msgTimer)
    if (this.unsubscribe) this.unsubscribe()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pt-6 pb-16">
    <div class="max-w-7xl mx-auto px-4">
      <nav aria-label="Ruta de navegación" class="mb-6 text-sm">
        <ol class="flex flex-wrap items-center gap-1 text-gray-600">
          <li><RouterLink to="/productos" class="text-primary-700 font-medium hover:underline">Catálogo</RouterLink></li>
          <li v-if="product" aria-hidden="true">/</li>
          <li v-if="product" class="truncate max-w-[60vw] text-gray-700" aria-current="page">{{ product.name }}</li>
        </ol>
      </nav>

      <LoadingSpinner v-if="loading" message="Cargando producto..." />

      <div v-else-if="!product" class="bg-white rounded-xl border border-gray-200 p-10 sm:p-12 text-center" :role="loadError ? 'alert' : null">
        <h1 class="font-heading text-2xl font-bold text-gray-800 mb-2">
          {{ loadError ? 'No pudimos cargar esta publicación' : 'No encontramos esta publicación' }}
        </h1>
        <p class="text-gray-600 mb-6">
          {{ loadError ? 'Revisá tu conexión e intentá de nuevo.' : 'Puede que ya no esté disponible o que el enlace sea incorrecto.' }}
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <button v-if="loadError" type="button" @click="loadProduct" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">Reintentar</button>
          <RouterLink to="/productos" class="px-5 py-2.5 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition">Ver catálogo</RouterLink>
        </div>
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          <div>
            <img :src="imageSrc" :alt="product.name" class="w-full aspect-[4/3] object-cover rounded-xl bg-gray-100 md:sticky md:top-24" @error="imageFailed = true" />
          </div>

          <div>
            <p v-if="typeLabel" class="inline-block mb-3 px-2.5 py-1 rounded-md bg-secondary-50 text-secondary-800 text-xs font-semibold">{{ typeLabel }}</p>

            <h1 class="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-3">{{ product.name }}</h1>

            <p v-if="product.is_active === false" class="mb-4 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium" role="status">
              Esta publicación está pausada por el vendedor: se puede ver pero no comprar.
            </p>

            <div v-if="hasRating" class="flex items-center gap-3 mb-6">
              <div class="flex items-center gap-1">
                <svg class="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="text-lg font-semibold text-gray-800">{{ product.seller.rating }}</span>
              </div>
              <span class="text-gray-400">•</span>
              <span class="text-sm text-gray-600">{{ product.seller.sales_count }} ventas</span>
            </div>

            <ProductPrice v-if="priceBlock" v-bind="priceBlock" />

            <div class="mb-6">
              <h2 class="font-heading text-lg font-semibold text-gray-800 mb-2">Descripción</h2>
              <p class="text-gray-700 leading-relaxed whitespace-pre-line max-w-prose">{{ product.description || 'El vendedor no agregó una descripción.' }}</p>
            </div>

            <component
              v-if="purchaseComponent"
              :is="purchaseComponent"
              ref="purchase"
              v-bind="purchaseProps"
              @add-to-cart="addToCart"
            >
              <CartFeedback :message="cartMessage" :type="cartMessageType" :needs-login="needsLogin" />
            </component>

            <ProductSeller :seller="product.seller" />
          </div>
        </div>
      </div>

      <div v-if="product && relatedProducts.length > 0" class="mt-12">
        <h2 class="font-heading text-2xl font-bold text-gray-800 mb-6">También te puede interesar</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <ProductCard
            v-for="relatedProduct in relatedProducts"
            :key="relatedProduct.id"
            :product="relatedProduct"
            :heading-level="3"
          />
        </div>
      </div>
    </div>
  </div>
</template>
