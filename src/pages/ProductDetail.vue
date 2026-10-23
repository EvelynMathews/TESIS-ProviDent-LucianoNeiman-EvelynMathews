<script>
/**
 * Propósito: Vista de detalle para un producto o servicio específico del marketplace.
 * Función: Mostrar toda la información del producto, configurar variantes (especialmente para prótesis con su compleja lógica de selección de dientes y precios) y permitir añadir al carrito o solicitar el servicio.
 * Cómo funciona: `loadProduct` carga el producto por ID y sus catálogos asociados (materiales, tipos de trabajo, dientes). Las propiedades computadas como `totalPrice`, `isMatrixMode` y `availableTeethForWorkType` gestionan la lógica de precios y selección de componentes de la prótesis (o la cantidad simple para insumos) de forma dinámica. `addToCart` simula la acción final de compra/solicitud.
 */
import { subscribeToAuthStateChanges } from '../services/auth'
import { getProductById, listActiveProducts, loadMaterials, loadWorkTypes, loadToothGroups, loadTeeth, loadValidWorkGroupCombinations } from '../services/products'
import { checkRentalAvailability as checkAvailability } from '../services/rental-availability'
import { addToCart as addToCartService } from '../services/cart'
import ProductCard from '../components/ProductCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

export default {
    name: 'ProductDetail',
    components: {
        ProductCard,
        LoadingSpinner
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
            },
            product: null,
            quantity: 1,
            loading: true,
            loadError: false,
            addingToCart: false,
            needsLogin: false,
            imageFailed: false,
            relatedProducts: [],
            // For prosthesis products
            materials: [],
            workTypes: [],
            toothGroups: [],
            teeth: [],
            validCombinations: [],
            // For variant A (default)
            selectedWorkType: null,
            selectedTeethIds: [],
            // For variants B and C (matrix modes)
            selectedCombinations: [], // [{toothId, workTypeId, price}]
            // For rental products
            rentalStartDate: '',
            rentalEndDate: '',
            rentalStartTime: '09:00',
            rentalEndTime: '18:00',
            rentalErrors: {
                startDate: '',
                endDate: '',
                availability: ''
            },
            // For plaster service products
            plasterDescription: '',
            plasterError: '',
            // Cart feedback
            cartMessage: '',
            cartMessageType: ''
        }
    },
    computed: {
        todayISO() {
            const d = new Date()
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
            return d.toISOString().slice(0, 10)
        },
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
        isMatrixMode() {
            return this.uiMode === 'matrix' || this.uiMode === 'matrix4'
        },
        totalPrice() {
            if (this.product.product_type === 'SUPPLY') {
                return this.product.price * this.quantity
            } else if (this.product.product_type === 'PROSTHESIS') {
                if (this.isMatrixMode) {
                    // Matrix mode: sum prices from selectedCombinations
                    return this.selectedCombinations.reduce((total, combo) => {
                        return total + (combo.price || 0)
                    }, 0)
                } else {
                    // Default mode: sum prices of selected teeth for the current work type
                    return this.selectedTeethIds.reduce((total, toothId) => {
                        const tooth = this.availableTeethForWorkType.find(t => t.tooth.id === toothId)
                        return total + (tooth?.price || 0)
                    }, 0)
                }
            } else if (this.product.product_type === 'PLASTER_SERVICE') {
                return this.product.base_price || 0
            } else if (this.product.product_type === 'RENTAL') {
                return this.rentalTotalDays * (this.product.daily_price || 0)
            }
            return 0
        },
        rentalTotalDays() {
            if (!this.rentalStartDate || !this.rentalEndDate) return 0
            const start = new Date(this.rentalStartDate)
            const end = new Date(this.rentalEndDate)
            const diffTime = Math.abs(end - start)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays + 1
        },
        availableTeethForWorkType() {
            if (!this.product || this.product.product_type !== 'PROSTHESIS') return []
            if (!this.selectedWorkType) return []
            if (!this.teeth || this.teeth.length === 0) return []

            // Get groups that have prices for the selected work type
            const groupPrices = {}
            this.product.pricing_matrix.forEach(p => {
                if (p.work_type_id === this.selectedWorkType && p.unit_price > 0) {
                    groupPrices[p.tooth_group_id] = p.unit_price
                }
            })

            // Filter teeth and add price info
            return this.teeth
                .filter(tooth => groupPrices[tooth.tooth_group_id])
                .map(tooth => {
                    const group = this.toothGroups.find(g => g.id === tooth.tooth_group_id)
                    return {
                        tooth: tooth,
                        group_name: group?.name || '',
                        price: groupPrices[tooth.tooth_group_id]
                    }
                })
        },
        priceSummaryForWorkType() {
            if (!this.product || this.product.product_type !== 'PROSTHESIS') return []
            if (!this.selectedWorkType) return []
            if (!this.product.pricing_matrix) return []

            const uniqueGroups = {}
            this.product.pricing_matrix.forEach(p => {
                if (p.work_type_id === this.selectedWorkType) {
                    const group = this.toothGroups.find(g => g.id === p.tooth_group_id)
                    if (group && !uniqueGroups[p.tooth_group_id]) {
                        uniqueGroups[p.tooth_group_id] = {
                            groupName: group.name,
                            price: p.unit_price
                        }
                    }
                }
            })
            return Object.values(uniqueGroups)
        },
        teethByQuadrant() {
            if (!this.teeth || this.teeth.length === 0) return {}
            return {
                1: this.teeth.filter(t => t.fdi_code >= 11 && t.fdi_code <= 18).sort((a, b) => a.fdi_code - b.fdi_code),
                2: this.teeth.filter(t => t.fdi_code >= 21 && t.fdi_code <= 28).sort((a, b) => a.fdi_code - b.fdi_code),
                3: this.teeth.filter(t => t.fdi_code >= 31 && t.fdi_code <= 38).sort((a, b) => a.fdi_code - b.fdi_code),
                4: this.teeth.filter(t => t.fdi_code >= 41 && t.fdi_code <= 48).sort((a, b) => a.fdi_code - b.fdi_code)
            }
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
        initials(name) {
            if (!name) return '?'
            const parts = String(name).trim().split(/\s+/)
            const a = parts[0]?.[0] || ''
            const b = parts[1]?.[0] || ''
            return (a + b).toUpperCase() || a.toUpperCase() || '?'
        },
        increaseQuantity() {
            if (this.quantity < this.product.stock) {
                this.quantity++
            }
        },
        decreaseQuantity() {
            if (this.quantity > 1) {
                this.quantity--
            }
        },
        validateRentalDates() {
            this.rentalErrors = { startDate: '', endDate: '', availability: '' }

            if (!this.rentalStartDate) {
                this.rentalErrors.startDate = 'Selecciona una fecha de inicio'
                return false
            }
            if (!this.rentalEndDate) {
                this.rentalErrors.endDate = 'Selecciona una fecha de fin'
                return false
            }

            const start = new Date(this.rentalStartDate)
            const end = new Date(this.rentalEndDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            if (start < today) {
                this.rentalErrors.startDate = 'La fecha de inicio no puede ser anterior a hoy'
                return false
            }
            if (end < start) {
                this.rentalErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio'
                return false
            }

            return true
        },
        validatePlasterDescription() {
            this.plasterError = ''

            if (!this.plasterDescription || this.plasterDescription.trim().length === 0) {
                this.plasterError = 'Debes describir lo que necesitas'
                return false
            }

            if (this.plasterDescription.trim().length < 10) {
                this.plasterError = 'La descripción debe tener al menos 10 caracteres'
                return false
            }

            return true
        },
        async checkRentalAvailability() {
            try {
                const result = await checkAvailability(
                    this.product.id,
                    this.rentalStartDate,
                    this.rentalEndDate
                )
                return result.available
            } catch (error) {
                console.error('Error checking availability:', error)
                return false
            }
        },
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
                let productData = {
                    id: this.product.id,
                    product_type: this.product.product_type,
                    price: 0,
                    quantity: 1
                }
                let typeSpecificData = {}

                if (this.product.product_type === 'SUPPLY') {
                    productData.price = this.product.price
                    productData.quantity = this.quantity
                } else if (this.product.product_type === 'PROSTHESIS') {
                    productData.price = this.totalPrice
                    productData.quantity = 1

                    const prosthesisConfig = {
                        workType: this.selectedWorkType,
                        teeth: this.selectedTeethIds,
                        combinations: this.selectedCombinations,
                        mode: this.uiMode
                    }
                    typeSpecificData.options_json = prosthesisConfig
                } else if (this.product.product_type === 'PLASTER_SERVICE') {
                    if (!this.validatePlasterDescription()) {
                        return
                    }
                    productData.price = this.product.base_price
                    productData.quantity = 1

                    typeSpecificData.plaster = {
                        custom_description: this.plasterDescription.trim()
                    }
                } else if (this.product.product_type === 'RENTAL') {
                    if (!this.validateRentalDates()) {
                        return
                    }

                    const isAvailable = await this.checkRentalAvailability()
                    if (!isAvailable) {
                        this.rentalErrors.availability = 'No hay disponibilidad para este período'
                        return
                    }

                    productData.price = this.totalPrice
                    productData.quantity = 1

                    typeSpecificData.rental = {
                        start_date: this.rentalStartDate,
                        end_date: this.rentalEndDate,
                        start_time: this.rentalStartTime,
                        end_time: this.rentalEndTime,
                        total_days: this.rentalTotalDays,
                        calculated_price: this.totalPrice
                    }
                }

                const result = await addToCartService(productData, typeSpecificData)
                this.needsLogin = !!result.needsAuth

                if (result.success) {
                    this.cartMessage = result.message
                    this.cartMessageType = 'success'

                    if (this.product.product_type === 'PLASTER_SERVICE') {
                        this.plasterDescription = ''
                    }
                    if (this.product.product_type === 'RENTAL') {
                        this.rentalStartDate = ''
                        this.rentalEndDate = ''
                        this.rentalStartTime = '09:00'
                        this.rentalEndTime = '18:00'
                    }

                    clearTimeout(this._msgTimer)
                    this._msgTimer = setTimeout(() => {
                        this.cartMessage = ''
                    }, 5000)
                } else {
                    this.cartMessage = result.message || 'Error al agregar al carrito'
                    this.cartMessageType = 'error'
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
                const sameType = items.filter(p => p.id !== currentId && p.product_type === this.product?.product_type)
                const others = items.filter(p => p.id !== currentId && p.product_type !== this.product?.product_type)
                this.relatedProducts = [...sameType, ...others].slice(0, 4)
            } catch (e) { console.error(e) }
        },
        async loadProduct() {
            this.loading = true
            this.loadError = false
            this.imageFailed = false
            this.quantity = 1
            this.cartMessage = ''
            this.selectedTeethIds = []
            this.selectedCombinations = []
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

                // Load catalogs for prosthesis products
                if (p.product_type === 'PROSTHESIS') {
                    this.materials = await loadMaterials()
                    this.workTypes = await loadWorkTypes()
                    this.toothGroups = await loadToothGroups()
                    this.teeth = await loadTeeth()
                    this.validCombinations = await loadValidWorkGroupCombinations()

                    // Set default selections if available (variant A only)
                    if (!this.isMatrixMode && this.workTypes.length > 0) {
                        this.selectedWorkType = this.workTypes[0].id
                    }
                }

                await this.loadRelatedProducts()
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
        },
        isValidToothWorkTypeCombination(toothId, workTypeId) {
            // Check if this tooth-workType combination is valid
            if (!this.validCombinations || this.validCombinations.length === 0) return true

            const tooth = this.teeth.find(t => t.id === toothId)
            if (!tooth) return false

            return this.validCombinations.some(
                c => c.work_type_id === workTypeId && c.tooth_group_id === tooth.tooth_group_id
            )
        },
        getPriceForToothAndWorkType(toothId, workTypeId) {
            if (!this.product || !this.product.pricing_matrix) return 0

            const tooth = this.teeth.find(t => t.id === toothId)
            if (!tooth) return 0

            const price = this.product.pricing_matrix.find(
                p => p.work_type_id === workTypeId && p.tooth_group_id === tooth.tooth_group_id
            )

            return price?.unit_price || 0
        },
        isCombinationSelected(toothId, workTypeId) {
            return this.selectedCombinations.some(
                c => c.toothId === toothId && c.workTypeId === workTypeId
            )
        },
        toggleCombination(toothId, workTypeId) {
            const index = this.selectedCombinations.findIndex(
                c => c.toothId === toothId && c.workTypeId === workTypeId
            )

            if (index >= 0) {
                // Remove if already selected
                this.selectedCombinations.splice(index, 1)
            } else {
                // Add new combination
                const price = this.getPriceForToothAndWorkType(toothId, workTypeId)
                this.selectedCombinations.push({
                    toothId,
                    workTypeId,
                    price
                })
            }
        }
    },
    watch: {
        selectedWorkType() {
            // Clear tooth selection when work type changes (variant A only)
            if (!this.isMatrixMode) {
                this.selectedTeethIds = []
            }
        },
        '$route.params.id'() {
            // Reload product when navigating to a different product
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

                        <!-- Price section for SUPPLY products -->
                        <div v-if="product.product_type === 'SUPPLY'" class="mb-6">
                            <p class="text-4xl font-bold text-gray-900 mb-1 tabular-nums">${{ formatPrice(product.price) }}</p>
                            <p class="text-sm text-gray-600">por {{ product.unit || 'unidad' }}</p>
                        </div>

                        <!-- Price section for PLASTER_SERVICE products -->
                        <div v-if="product.product_type === 'PLASTER_SERVICE'" class="mb-6">
                            <p class="text-4xl font-bold text-gray-900 mb-1 tabular-nums">${{ formatPrice(product.base_price) }}</p>
                            <p class="text-sm text-gray-600">Precio base</p>
                        </div>

                        <!-- Price section for RENTAL products -->
                        <div v-if="product.product_type === 'RENTAL'" class="mb-6">
                            <p class="text-4xl font-bold text-gray-900 mb-1 tabular-nums">${{ formatPrice(product.daily_price) }}</p>
                            <p class="text-sm text-gray-600">por día</p>
                            <p v-if="product.refundable_deposit_amount > 0" class="text-sm text-gray-600 mt-2">
                                Depósito reembolsable: ${{ formatPrice(product.refundable_deposit_amount) }}
                            </p>
                        </div>

                        <div class="mb-6">
                            <h2 class="font-heading text-lg font-semibold text-gray-800 mb-2">Descripción</h2>
                            <p class="text-gray-700 leading-relaxed whitespace-pre-line max-w-prose">{{ product.description || 'El vendedor no agregó una descripción.' }}</p>
                        </div>

                        <!-- Configuration section for PLASTER_SERVICE products -->
                        <div v-if="product.product_type === 'PLASTER_SERVICE'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <label for="plaster-description" class="block font-heading font-semibold text-gray-800 mb-1">¿Qué necesitás?</label>
                            <p id="plaster-description-hint" class="text-sm text-gray-600 mb-3">Contale al laboratorio el tipo de modelo, cantidad y cualquier detalle importante.</p>
                            <textarea
                                id="plaster-description"
                                v-model="plasterDescription"
                                rows="4"
                                placeholder="Ej: 2 modelos de trabajo en yeso tipo IV, arcada superior completa"
                                aria-describedby="plaster-description-hint plaster-description-count"
                                :aria-invalid="!!plasterError"
                                class="field-input resize-y"
                            ></textarea>
                            <p v-if="plasterError" class="field-error" role="alert">{{ plasterError }}</p>
                            <p id="plaster-description-count" class="field-hint">
                                {{ plasterDescription.trim().length }} / mínimo 10 caracteres
                            </p>
                        </div>

                        <!-- Configuration section for RENTAL products -->
                        <div v-if="product.product_type === 'RENTAL'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Elegí las fechas</h2>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="rental-start" class="field-label">Desde</label>
                                    <input
                                        id="rental-start"
                                        type="date"
                                        v-model="rentalStartDate"
                                        :min="todayISO"
                                        :aria-invalid="!!rentalErrors.startDate"
                                        class="field-input"
                                    />
                                    <p v-if="rentalErrors.startDate" class="field-error" role="alert">{{ rentalErrors.startDate }}</p>
                                </div>
                                <div>
                                    <label for="rental-end" class="field-label">Hasta</label>
                                    <input
                                        id="rental-end"
                                        type="date"
                                        v-model="rentalEndDate"
                                        :min="rentalStartDate || todayISO"
                                        :aria-invalid="!!rentalErrors.endDate"
                                        class="field-input"
                                    />
                                    <p v-if="rentalErrors.endDate" class="field-error" role="alert">{{ rentalErrors.endDate }}</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="rental-start-time" class="field-label">Hora de entrega</label>
                                    <select
                                        id="rental-start-time"
                                        v-model="rentalStartTime"
                                        class="field-input"
                                    >
                                        <option value="08:00">08:00</option>
                                        <option value="09:00">09:00</option>
                                        <option value="10:00">10:00</option>
                                        <option value="11:00">11:00</option>
                                        <option value="12:00">12:00</option>
                                        <option value="13:00">13:00</option>
                                        <option value="14:00">14:00</option>
                                        <option value="15:00">15:00</option>
                                        <option value="16:00">16:00</option>
                                        <option value="17:00">17:00</option>
                                        <option value="18:00">18:00</option>
                                        <option value="19:00">19:00</option>
                                        <option value="20:00">20:00</option>
                                        <option value="21:00">21:00</option>
                                        <option value="22:00">22:00</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="rental-end-time" class="field-label">Hora de devolución</label>
                                    <select
                                        id="rental-end-time"
                                        v-model="rentalEndTime"
                                        class="field-input"
                                    >
                                        <option value="08:00">08:00</option>
                                        <option value="09:00">09:00</option>
                                        <option value="10:00">10:00</option>
                                        <option value="11:00">11:00</option>
                                        <option value="12:00">12:00</option>
                                        <option value="13:00">13:00</option>
                                        <option value="14:00">14:00</option>
                                        <option value="15:00">15:00</option>
                                        <option value="16:00">16:00</option>
                                        <option value="17:00">17:00</option>
                                        <option value="18:00">18:00</option>
                                        <option value="19:00">19:00</option>
                                        <option value="20:00">20:00</option>
                                        <option value="21:00">21:00</option>
                                        <option value="22:00">22:00</option>
                                    </select>
                                </div>
                            </div>

                            <div v-if="rentalErrors.availability" class="mb-4">
                                <p class="text-red-700 text-sm font-medium" role="alert">{{ rentalErrors.availability }}</p>
                            </div>

                            <div v-if="product.stock_qty" class="mb-4">
                                <p class="text-sm text-gray-600">
                                    <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    Unidades disponibles: {{ product.stock_qty }}
                                </p>
                            </div>

                            <div v-if="rentalTotalDays > 0" class="pt-4 border-t border-gray-200">
                                <p class="text-lg text-gray-700 mb-2">
                                    Período: <span class="font-semibold">{{ rentalTotalDays }} {{ rentalTotalDays === 1 ? 'día' : 'días' }}</span>
                                </p>
                                <p class="text-lg text-gray-700 mb-2">
                                    Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
                                </p>
                            </div>
                        </div>

                        <!-- Configuration section for PROSTHESIS products - Variant A (Default) -->
                        <div v-if="product.product_type === 'PROSTHESIS' && uiMode === 'default'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Configurá tu pedido</h2>

                            <div class="mb-4">
                                <label for="work-type" class="field-label">1. Tipo de trabajo</label>
                                <select id="work-type" v-model="selectedWorkType" class="field-input">
                                    <option v-for="wt in workTypes" :key="wt.id" :value="wt.id">
                                        {{ wt.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Price Summary Table -->
                            <div v-if="priceSummaryForWorkType.length > 0" class="mb-4">
                                <h4 class="text-sm font-semibold text-gray-700 mb-2">Precios por grupo de diente:</h4>
                                <div class="overflow-x-auto">
                                    <table class="w-full border-collapse border border-gray-300 rounded-lg">
                                        <thead>
                                            <tr class="bg-gray-100">
                                                <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Grupo de Diente</th>
                                                <th class="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Precio por Pieza</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="item in priceSummaryForWorkType" :key="item.groupName">
                                                <td class="border border-gray-300 px-4 py-2 text-sm text-gray-700">{{ item.groupName }}</td>
                                                <td class="border border-gray-300 px-4 py-2 text-sm text-gray-700 text-right font-semibold">${{ formatPrice(item.price) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="mb-4">
                                <p id="teeth-label" class="field-label">2. Piezas dentales</p>
                                <div v-if="!selectedWorkType" class="text-sm text-gray-500 italic">
                                    Primero seleccioná un tipo de trabajo
                                </div>
                                <div v-else-if="availableTeethForWorkType.length === 0" class="text-sm text-gray-500 italic">
                                    No hay piezas disponibles para este tipo de trabajo
                                </div>
                                <div v-else role="group" aria-labelledby="teeth-label" class="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
                                    <div v-for="item in availableTeethForWorkType" :key="item.tooth.id"
                                         class="flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded-md">
                                        <input
                                            type="checkbox"
                                            :id="`tooth-${item.tooth.id}`"
                                            :value="item.tooth.id"
                                            v-model="selectedTeethIds"
                                            class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                                        />
                                        <label :for="`tooth-${item.tooth.id}`" class="flex-1 flex items-center justify-between cursor-pointer">
                                            <span class="text-sm font-medium text-gray-700">
                                                Diente {{ item.tooth.fdi_code }} <span class="text-gray-500">({{ item.group_name }})</span>
                                            </span>
                                            <span class="text-sm font-semibold text-secondary">
                                                ${{ formatPrice(item.price) }}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-gray-200">
                                <p class="text-lg text-gray-700 mb-2">
                                    Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
                                </p>
                                <p class="text-sm text-gray-600">{{ selectedTeethIds.length }} {{ selectedTeethIds.length === 1 ? 'pieza seleccionada' : 'piezas seleccionadas' }}</p>
                            </div>
                        </div>

                        <!-- Configuration section for PROSTHESIS products - Variant B (Matrix) -->
                        <div v-if="product.product_type === 'PROSTHESIS' && uiMode === 'matrix'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Configurá tu pedido</h2>

                            <div class="overflow-x-auto">
                                <table class="w-full border-collapse border border-gray-300 text-sm">
                                    <thead>
                                        <tr class="bg-gray-200">
                                            <th class="border border-gray-300 px-2 py-2 text-left font-semibold sticky left-0 bg-gray-200">Diente</th>
                                            <th v-for="wt in workTypes" :key="wt.id"
                                                class="border border-gray-300 px-2 py-2 text-center font-semibold">
                                                {{ wt.name }}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="tooth in teeth" :key="tooth.id" class="hover:bg-gray-100">
                                            <td class="border border-gray-300 px-2 py-2 font-medium sticky left-0 bg-white">
                                                {{ tooth.fdi_code }}
                                            </td>
                                            <td v-for="wt in workTypes" :key="wt.id"
                                                class="border border-gray-300 px-2 py-2 text-center">
                                                <div v-if="isValidToothWorkTypeCombination(tooth.id, wt.id)">
                                                    <input
                                                        type="checkbox"
                                                        :aria-label="`Diente ${tooth.fdi_code}, ${wt.name}`"
                                                        :checked="isCombinationSelected(tooth.id, wt.id)"
                                                        @change="toggleCombination(tooth.id, wt.id)"
                                                        class="w-5 h-5 text-primary border-gray-300 rounded cursor-pointer"
                                                    />
                                                    <div class="text-xs text-gray-600 mt-1">
                                                        ${{ formatPrice(getPriceForToothAndWorkType(tooth.id, wt.id)) }}
                                                    </div>
                                                </div>
                                                <span v-else class="text-gray-300 text-xs">-</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="pt-4 border-t border-gray-200 mt-4">
                                <p class="text-lg text-gray-700 mb-2">
                                    Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
                                </p>
                                <p class="text-xs text-gray-500">{{ selectedCombinations.length }} combinación(es) seleccionada(s)</p>
                            </div>
                        </div>

                        <!-- Configuration section for PROSTHESIS products - Variant C (Matrix by Quadrant) -->
                        <div v-if="product.product_type === 'PROSTHESIS' && uiMode === 'matrix4'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h2 class="font-heading text-lg font-semibold text-gray-800 mb-3">Configurá tu pedido por cuadrante</h2>

                            <div v-for="(quadrantTeeth, quadrant) in teethByQuadrant" :key="quadrant" class="mb-6">
                                <h4 class="font-semibold text-gray-700 mb-2">Cuadrante {{ quadrant }}</h4>
                                <div class="overflow-x-auto">
                                    <table class="w-full border-collapse border border-gray-300 text-sm">
                                        <thead>
                                            <tr class="bg-gray-200">
                                                <th class="border border-gray-300 px-2 py-2 text-left font-semibold">Diente</th>
                                                <th v-for="wt in workTypes" :key="wt.id"
                                                    class="border border-gray-300 px-2 py-2 text-center font-semibold">
                                                    {{ wt.name }}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="tooth in quadrantTeeth" :key="tooth.id" class="hover:bg-gray-100">
                                                <td class="border border-gray-300 px-2 py-2 font-medium">
                                                    {{ tooth.fdi_code }}
                                                </td>
                                                <td v-for="wt in workTypes" :key="wt.id"
                                                    class="border border-gray-300 px-2 py-2 text-center">
                                                    <div v-if="isValidToothWorkTypeCombination(tooth.id, wt.id)">
                                                        <input
                                                            type="checkbox"
                                                            :aria-label="`Diente ${tooth.fdi_code}, ${wt.name}`"
                                                            :checked="isCombinationSelected(tooth.id, wt.id)"
                                                            @change="toggleCombination(tooth.id, wt.id)"
                                                            class="w-5 h-5 text-primary border-gray-300 rounded cursor-pointer"
                                                        />
                                                        <div class="text-xs text-gray-600 mt-1">
                                                            ${{ formatPrice(getPriceForToothAndWorkType(tooth.id, wt.id)) }}
                                                        </div>
                                                    </div>
                                                    <span v-else class="text-gray-300 text-xs">-</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-gray-200">
                                <p class="text-lg text-gray-700 mb-2">
                                    Total: <span class="font-bold text-3xl text-secondary">${{ formatPrice(totalPrice) }}</span>
                                </p>
                                <p class="text-xs text-gray-500">{{ selectedCombinations.length }} combinación(es) seleccionada(s)</p>
                            </div>
                        </div>

                        <!-- Stock and quantity section for SUPPLY products -->
                        <div v-if="product.product_type === 'SUPPLY' && product.stock > 0" class="mb-6">
                            <p class="text-sm text-secondary-800 font-medium mb-3">
                                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                                Stock disponible: {{ product.stock }} unidades
                            </p>

                            <div class="flex items-center gap-4 mb-6">
                                <span id="qty-label" class="font-semibold text-gray-700">Cantidad</span>
                                <div class="flex items-center border border-gray-300 rounded-lg" role="group" aria-labelledby="qty-label">
                                    <button @click="decreaseQuantity" type="button" aria-label="Restar uno"
                                        class="w-11 h-11 text-lg hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg"
                                        :disabled="quantity <= 1">
                                        −
                                    </button>
                                    <output class="w-14 text-center font-semibold tabular-nums border-x border-gray-300 leading-[2.75rem]" aria-live="polite">{{ quantity }}</output>
                                    <button @click="increaseQuantity" type="button" aria-label="Sumar uno"
                                        class="w-11 h-11 text-lg hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg"
                                        :disabled="quantity >= product.stock">
                                        +
                                    </button>
                                </div>
                            </div>

                            <div class="mb-6">
                                <p class="text-lg text-gray-700">
                                    Total: <span class="font-bold text-2xl text-gray-900 tabular-nums">${{ formatPrice(totalPrice) }}</span>
                                </p>
                            </div>

                            <button @click="addToCart" type="button" :disabled="addingToCart"
                                class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-70">
                                {{ addingToCart ? 'Agregando…' : 'Agregar al carrito' }}
                            </button>
                        </div>

                        <!-- Out of stock message for SUPPLY products only -->
                        <div v-if="product.product_type === 'SUPPLY' && (!product.stock || product.stock === 0)" class="mb-6">
                            <p class="inline-block px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 font-semibold">Sin stock por ahora</p>
                            <p class="text-sm text-gray-600 mt-2">Consultá al vendedor o mirá productos similares más abajo.</p>
                        </div>

                        <!-- Cart feedback message -->
                        <div v-if="cartMessage" class="mb-6 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3" role="status" aria-live="polite" :class="{
                            'bg-secondary-50 border border-secondary-200 text-secondary-800': cartMessageType === 'success',
                            'bg-red-50 border border-red-200 text-red-800': cartMessageType === 'error'
                        }">
                            <p class="font-semibold m-0">{{ cartMessage }}</p>
                            <RouterLink v-if="needsLogin" :to="{ path: '/login', query: { redirect: $route.fullPath } }" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600">Iniciar sesión</RouterLink>
                            <RouterLink v-else-if="cartMessageType === 'success'" to="/carrito" class="px-4 py-2 rounded-lg bg-white border border-secondary-300 text-secondary-800 text-sm font-semibold hover:bg-secondary-50">Ver carrito</RouterLink>
                        </div>

                        <!-- Action button for PROSTHESIS -->
                        <button v-if="product.product_type === 'PROSTHESIS'" @click="addToCart"
                            type="button"
                            :disabled="addingToCart || (isMatrixMode ? selectedCombinations.length === 0 : selectedTeethIds.length === 0)"
                            class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                            {{ addingToCart ? 'Agregando…' : 'Agregar pedido al carrito' }}
                        </button>
                        <p v-if="product.product_type === 'PROSTHESIS' && !(isMatrixMode ? selectedCombinations.length : selectedTeethIds.length)" class="text-sm text-gray-600 mb-6">
                            Elegí al menos una pieza para continuar.
                        </p>

                        <!-- Action button for PLASTER_SERVICE -->
                        <button v-if="product.product_type === 'PLASTER_SERVICE'" @click="addToCart" type="button" :disabled="addingToCart"
                            class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-70 mb-6">
                            {{ addingToCart ? 'Agregando…' : 'Agregar pedido al carrito' }}
                        </button>

                        <!-- Action button for RENTAL -->
                        <button v-if="product.product_type === 'RENTAL'" @click="addToCart"
                            type="button"
                            :disabled="addingToCart || !rentalStartDate || !rentalEndDate || rentalTotalDays === 0"
                            class="w-full h-12 bg-primary text-white font-semibold px-6 rounded-lg transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                            {{ addingToCart ? 'Verificando disponibilidad…' : 'Agregar alquiler al carrito' }}
                        </button>
                        <p v-if="product.product_type === 'RENTAL' && (!rentalStartDate || !rentalEndDate)" class="text-sm text-gray-600 mb-6">
                            Elegí fecha de inicio y de fin para ver el total.
                        </p>

                        <div class="border-t border-gray-200 pt-6">
                            <h2 class="font-heading text-base font-semibold text-gray-800 mb-3">Vendido por</h2>
                            <div class="flex items-center gap-3">
                                <img v-if="product.seller?.avatar_url" :src="product.seller.avatar_url" alt=""
                                     class="w-12 h-12 rounded-full object-cover" />
                                <div v-else class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700">
                                    {{ initials(product.seller?.username) }}
                                </div>
                                <div>
                                    <RouterLink :to="`/usuario/${product.seller?.id}`" class="font-semibold text-gray-800 hover:underline">
                                        {{ product.seller.username }}
                                    </RouterLink>
                                    <p class="text-sm m-0"><RouterLink :to="`/usuario/${product.seller?.id}`" class="text-primary-700 hover:underline">Ver más publicaciones</RouterLink></p>
                                    <p v-if="product.seller.location" class="text-sm text-gray-600">{{ product.seller.location }}</p>
                                </div>
                            </div>
                        </div>
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
