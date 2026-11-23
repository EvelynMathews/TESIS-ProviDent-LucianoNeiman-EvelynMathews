<script>
/**
 * Propósito: Flujo de formulario multi-paso para que un vendedor cree una nueva publicación (producto o servicio).
 * Función: Guiar al usuario a través de la selección de tipo de publicación, la carga de datos y la publicación final.
 * Cómo funciona: Gestiona los pasos (`currentStep`, `nextStep`, `prevStep`). Los campos de cada tipo están en
 * componentes de `components/product-forms` (los mismos que usa Editar producto) y `missingFields` dice qué falta.
 * `publishListing` llama a la función `create...Product` que corresponde al tipo elegido.
 */
import { createSupplyProduct, createProsthesisProduct, createPlasterServiceProduct, createRentalProduct } from '../services/products'
import { listMyShippingMethods, shippingSummary } from '../services/shipping'
import { isCurrentUserSeller } from '../services/sellers'
import { emptyForms, missingFields, supplyUnitLabel } from '../components/product-forms/listing-form'
import SupplyForm from '../components/product-forms/SupplyForm.vue'
import ProsthesisForm from '../components/product-forms/ProsthesisForm.vue'
import PlasterForm from '../components/product-forms/PlasterForm.vue'
import RentalForm from '../components/product-forms/RentalForm.vue'
import ListingPreview from '../components/product-forms/ListingPreview.vue'
import ShippingMethodModal from '../components/ShippingMethodModal.vue'
import ShippingIcon from '../components/ShippingIcon.vue'

const FORM_HEADERS = {
    supply: { title: 'Datos del Producto', subtitle: 'Completá la información de tu producto', box: 'bg-primary-50', text: 'text-primary' },
    prosthesis: { title: 'Servicio de Prótesis', subtitle: 'Configurá tu servicio y matriz de precios', box: 'bg-primary-50', text: 'text-primary' },
    plaster: { title: 'Modelado en Yeso', subtitle: 'Configurá tu servicio de vaciado y modelado', box: 'bg-secondary-soft', text: 'text-secondary' },
    rental: { title: 'Alquiler de Equipos', subtitle: 'Configurá tu servicio de alquiler', box: 'bg-accent-soft', text: 'text-accent' }
}

// Full class names so Tailwind includes them in the build
const PROGRESS_WIDTHS = {
    4: ['w-1/4', 'w-2/4', 'w-3/4', 'w-full'],
    5: ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full']
}

function newForms() {
    return {
        supply: emptyForms.supply(),
        prosthesis: emptyForms.prosthesis(),
        plaster: emptyForms.plaster(),
        rental: emptyForms.rental()
    }
}

export default {
    name: 'Publish',
    components: { SupplyForm, ProsthesisForm, PlasterForm, RentalForm, ListingPreview, ShippingMethodModal, ShippingIcon },
    data() {
        return {
            currentStep: 1,
            totalSteps: 4,
            publicationType: null, // 'product' or 'service'
            serviceType: null, // 'prosthesis', 'plaster', 'rental'
            forms: newForms(),
            shippingMethods: [],
            shippingModal: null,
            previewMode: false,
            published: false,
            errorMessage: null
        }
    },
    computed: {
        formType() {
            return this.publicationType === 'product' ? 'supply' : this.serviceType
        },
        currentForm() {
            return this.forms[this.formType]
        },
        formHeader() {
            return FORM_HEADERS[this.formType]
        },
        selectedShippingMethod() {
            return this.shippingMethods.find(m => m.id === this.forms.supply.shippingMethodId) || null
        },
        progressPercentage() {
            return (this.currentStep / this.totalSteps) * 100
        },
        progressWidth() {
            return PROGRESS_WIDTHS[this.totalSteps][this.currentStep - 1]
        },
        missingFields() {
            if (this.currentStep !== 3 || !this.formType) return []
            const missing = missingFields(this.formType, this.currentForm, { requireImage: true })
            if (this.formType === 'supply' && !this.selectedShippingMethod?.configured) {
                missing.push('método de envío con precio y cobertura')
            }
            return missing
        },
        canProceed() {
            if (this.currentStep === 1) {
                return this.publicationType !== null
            }
            if (this.currentStep === 2 && this.publicationType === 'service') {
                return this.serviceType !== null
            }
            if (this.currentStep === 3) {
                return this.missingFields.length === 0
            }
            return true
        }
    },
    methods: {
        showError(message) {
            this.errorMessage = message
            setTimeout(() => { this.errorMessage = null }, 5000)
        },

        selectPublicationType(type) {
            this.publicationType = type
            if (type === 'product') {
                this.totalSteps = 4
                this.currentStep = 3 // Skip service type selection
            } else {
                this.totalSteps = 5
                this.currentStep = 2
            }
        },

        selectServiceType(type) {
            this.serviceType = type
            this.currentStep = 3
        },

        nextStep() {
            if (this.canProceed) {
                if (this.currentStep === 3) {
                    this.previewMode = true
                } else {
                    this.currentStep++
                }
            }
        },

        prevStep() {
            if (this.currentStep > 1) {
                if (this.previewMode) {
                    this.previewMode = false
                } else {
                    this.currentStep--
                    if (this.currentStep === 2 && this.publicationType === 'product') {
                        this.currentStep = 1
                        this.publicationType = null
                    }
                }
            }
        },

        goBackToStart() {
            this.currentStep = 1
            this.publicationType = null
            this.serviceType = null
            this.previewMode = false
            this.published = false
            this.forms = newForms()
            this.loadShippingMethods()
        },

        createListing(type, f) {
            if (type === 'supply') {
                return createSupplyProduct({
                    name: f.name,
                    description: f.description,
                    unit_price: Number(f.price) || 0,
                    unit_label: supplyUnitLabel(f) || 'unidad',
                    stock_qty: Number(f.stock) || null,
                    sku: f.sku || null,
                    imageFile: f.imageFile,
                    shipping_method_id: f.shippingMethodId,
                })
            }
            if (type === 'prosthesis') {
                return createProsthesisProduct({
                    name: f.name,
                    description: f.description,
                    imageFile: f.imageFile,
                    pricingMatrix: f.pricingMatrix,
                    materialId: f.material || null,
                    deliveryTime: f.deliveryTime || null,
                })
            }
            if (type === 'plaster') {
                return createPlasterServiceProduct({
                    name: f.name,
                    description: f.description,
                    base_price: Number(f.basePrice) || 0,
                    deliveryTime: f.deliveryTime || null,
                    imageFile: f.imageFile,
                })
            }
            return createRentalProduct({
                name: f.name,
                description: f.description,
                stock_qty: Number(f.stock) || 0,
                priceDay: Number(f.priceDay) || null,
                priceWeek: Number(f.priceWeek) || null,
                priceMonth: Number(f.priceMonth) || null,
                imageFile: f.imageFile,
            })
        },

        async publishListing() {
            if (this.missingFields.length) {
                this.showError(`Para publicar completá: ${this.missingFields.join(', ')}.`)
                return
            }
            try {
                await this.createListing(this.formType, this.currentForm)
                this.published = true
                this.currentStep = 4
            } catch (e) {
                this.showError('No se pudo publicar. Revisá los datos e intentá nuevamente.')
                console.error(e)
            }
        },

        async loadShippingMethods(selectId = null) {
            try {
                // Only active methods can be chosen for a new publication
                this.shippingMethods = (await listMyShippingMethods()).filter(m => m.active)
                const supply = this.forms.supply
                if (selectId) {
                    supply.shippingMethodId = selectId
                } else if (!this.shippingMethods.some(m => m.id === supply.shippingMethodId)) {
                    supply.shippingMethodId = this.shippingMethods.find(m => m.configured)?.id || null
                }
            } catch {
                this.shippingMethods = []
            }
        },
        shippingOptionLabel(method) {
            return `${method.name} — ${shippingSummary(method)}`
        },
        async onShippingSaved(id) {
            await this.loadShippingMethods(id)
            this.shippingModal = null
        }
    },
    async mounted() {
        const isSeller = await isCurrentUserSeller()
        if (!isSeller) {
            this.$router.push('/seller-setup')
            return
        }
        this.loadShippingMethods()
    }
}
</script>

<template>
    <section class="min-h-screen bg-gray-50 pb-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header -->
            <div v-if="!published" class="mb-8">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">Publicar en ProviDent</h1>
                <p class="text-gray-600">Seguí los pasos para crear tu publicación</p>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <div class="flex items-start">
                    <svg class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"></path>
                    </svg>
                    <p class="text-sm text-red-800 font-medium">{{ errorMessage }}</p>
                </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="!published && !previewMode" class="mb-8">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-primary">
                        Paso {{ currentStep }} de {{ totalSteps }}
                    </span>
                    <span class="text-sm font-semibold text-secondary">
                        {{ Math.round(progressPercentage) }}% completado
                    </span>
                </div>
                <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-300 rounded-full bg-linear-90 from-primary to-secondary"
                        :class="progressWidth">
                    </div>
                </div>
            </div>

            <!-- Step 1: Choose Publication Type -->
            <div v-if="currentStep === 1 && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-linear-135 from-primary to-secondary">
                        <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z">
                            </path>
                        </svg>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">¿Qué querés publicar?</h2>
                    <p class="text-gray-600">Seleccioná el tipo de publicación que querés crear</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div @click="selectPublicationType('product')" @keydown.enter.prevent="selectPublicationType('product')" @keydown.space.prevent="selectPublicationType('product')"
                        role="button" tabindex="0"
                        class="p-8 border-2 border-primary rounded-lg transition-all hover:shadow-lg group cursor-pointer"
                        :class="{ 'bg-blue-50': publicationType === 'product' }">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all"
                            :class="publicationType === 'product' ? 'bg-primary' : 'bg-primary-50'">
                            <svg class="w-8 h-8 transition-colors"
                                :class="publicationType === 'product' ? 'text-white' : 'text-primary'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z">
                                </path>
                            </svg>
                        </div>
                        <h3 class="font-heading text-xl font-bold text-gray-800 mb-2">Producto</h3>
                        <p class="text-sm text-gray-600">Artículos físicos: resinas, instrumental, equipamiento,
                            indumentaria</p>
                    </div>

                    <div @click="selectPublicationType('service')" @keydown.enter.prevent="selectPublicationType('service')" @keydown.space.prevent="selectPublicationType('service')"
                        role="button" tabindex="0"
                        class="p-8 border-2 border-secondary rounded-lg transition-all hover:shadow-lg group cursor-pointer"
                        :class="{ 'bg-teal-50': publicationType === 'service' }">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all"
                            :class="publicationType === 'service' ? 'bg-secondary' : 'bg-secondary-soft'">
                            <svg class="w-8 h-8 transition-colors"
                                :class="publicationType === 'service' ? 'text-white' : 'text-secondary'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                                    clip-rule="evenodd"></path>
                                <path
                                    d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z">
                                </path>
                            </svg>
                        </div>
                        <h3 class="font-heading text-xl font-bold text-gray-800 mb-2">Servicio</h3>
                        <p class="text-sm text-gray-600">Prótesis, modelado en yeso, alquiler de equipos</p>
                    </div>
                </div>
            </div>

            <!-- Step 2: Choose Service Type (only if service selected) -->
            <div v-if="currentStep === 2 && publicationType === 'service' && !previewMode"
                class="bg-white rounded-lg shadow-md p-8">
                <div class="text-center mb-8">
                    <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">¿Qué tipo de servicio ofrecés?</h2>
                    <p class="text-gray-600">Elegí la categoría que mejor describa tu servicio</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div @click="selectServiceType('prosthesis')" @keydown.enter.prevent="selectServiceType('prosthesis')" @keydown.space.prevent="selectServiceType('prosthesis')"
                        role="button" tabindex="0"
                        class="p-6 border-2 rounded-lg transition-all hover:shadow-lg cursor-pointer border-primary"
                        :class="{ 'bg-blue-50': serviceType === 'prosthesis' }">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-primary-50">
                            <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm-5 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z">
                                </path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 mb-1">Prótesis</h3>
                        <p class="text-xs text-gray-600">Piezas terminadas por encargo</p>
                    </div>

                    <div @click="selectServiceType('plaster')" @keydown.enter.prevent="selectServiceType('plaster')" @keydown.space.prevent="selectServiceType('plaster')"
                        role="button" tabindex="0"
                        class="p-6 border-2 rounded-lg transition-all hover:shadow-lg cursor-pointer border-secondary"
                        :class="{ 'bg-teal-50': serviceType === 'plaster' }">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-secondary-soft">
                            <svg class="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                    clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 mb-1">Modelado en yeso</h3>
                        <p class="text-xs text-gray-600">Vaciado y modelado</p>
                    </div>

                    <div @click="selectServiceType('rental')" @keydown.enter.prevent="selectServiceType('rental')" @keydown.space.prevent="selectServiceType('rental')"
                        role="button" tabindex="0"
                        class="p-6 border-2 rounded-lg transition-all hover:shadow-lg cursor-pointer border-accent"
                        :class="{ 'bg-accent-50': serviceType === 'rental' }">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-accent-soft">
                            <svg class="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z">
                                </path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 mb-1">Alquiler</h3>
                        <p class="text-xs text-gray-600">Equipos odontológicos</p>
                    </div>
                </div>

                <div class="mt-6 flex justify-center">
                    <button @click="prevStep"
                        class="px-6 py-2 border-2 font-semibold rounded-lg transition hover:bg-gray-50 text-primary border-primary">
                        Volver
                    </button>
                </div>
            </div>

            <!-- Step 3: form of the chosen type -->
            <div v-if="currentStep === 3 && !previewMode && formType" class="bg-white rounded-lg shadow-md p-5 sm:p-8">
                <div class="p-4 rounded-lg mb-6" :class="formHeader.box">
                    <h2 class="font-heading text-xl font-bold mb-2" :class="formHeader.text">{{ formHeader.title }}</h2>
                    <p class="text-sm text-gray-600">{{ formHeader.subtitle }}</p>
                </div>

                <SupplyForm v-if="formType === 'supply'" :form="forms.supply" is-new @invalid="showError" />
                <ProsthesisForm v-else-if="formType === 'prosthesis'" :form="forms.prosthesis" is-new @invalid="showError" />
                <PlasterForm v-else-if="formType === 'plaster'" :form="forms.plaster" is-new @invalid="showError" />
                <RentalForm v-else-if="formType === 'rental'" :form="forms.rental" is-new @invalid="showError" />

                <!-- Shipping method (only for supplies) -->
                <div v-if="formType === 'supply'" class="mt-6">
                    <label for="supply-shipping" class="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                        <ShippingIcon icon="truck" class="w-4 h-4 text-primary" />
                        Método de envío para este producto *
                    </label>
                    <div class="flex flex-col sm:flex-row gap-3">
                        <select v-if="shippingMethods.length" id="supply-shipping" v-model="forms.supply.shippingMethodId"
                            class="field-input flex-1">
                            <option :value="null" disabled>Elegí cómo lo vas a enviar</option>
                            <option v-for="sm in shippingMethods" :key="sm.id" :value="sm.id">{{ shippingOptionLabel(sm) }}</option>
                        </select>
                        <p v-else class="flex-1 flex items-center gap-2 m-0 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                            <ShippingIcon icon="package" class="w-5 h-5" />
                            Todavía no tenés métodos de envío activos. Creá uno para poder publicar.
                        </p>
                        <button type="button" @click="shippingModal = { method: null }"
                            class="h-12 px-5 whitespace-nowrap font-semibold rounded-lg border-2 border-primary text-primary hover:bg-primary-50 transition">
                            + Nuevo método
                        </button>
                    </div>
                    <div v-if="selectedShippingMethod && !selectedShippingMethod.configured"
                        class="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex flex-wrap items-center justify-between gap-2" role="status">
                        <span>Este método todavía no tiene precio ni provincias.</span>
                        <button type="button" class="font-semibold underline" @click="shippingModal = { method: selectedShippingMethod }">Completarlo ahora</button>
                    </div>
                    <p v-else-if="selectedShippingMethod" class="field-hint">
                        Podés editar o pausar tus métodos desde <RouterLink to="/seller-setup" class="font-semibold text-primary-700 hover:underline">Configurar ventas</RouterLink>.
                    </p>
                </div>
            </div>

            <!-- Navigation Buttons for Step 3 forms -->
            <div v-if="currentStep === 3 && !previewMode" class="mt-6">
                <p v-if="missingFields.length" class="mb-3 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" role="status">
                    Para continuar completá: <strong>{{ missingFields.join(', ') }}</strong>.
                </p>
                <div class="flex gap-4">
                    <button @click="prevStep" type="button"
                        class="flex-1 h-12 px-6 border-2 border-primary text-primary font-semibold rounded-lg transition hover:bg-primary-50">
                        Anterior
                    </button>
                    <button @click="nextStep" type="button" :disabled="!canProceed"
                        class="flex-1 h-12 px-6 bg-primary text-white font-semibold rounded-lg transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Revisar y publicar
                    </button>
                </div>
            </div>

            <!-- Preview Page -->
            <div v-if="previewMode && !published" class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="p-4 bg-linear-135 from-primary to-secondary">
                    <h2 class="font-heading text-xl font-bold text-white mb-1">Preview de tu publicación</h2>
                    <p class="text-sm text-white opacity-90">Revisá que todo esté correcto antes de publicar</p>
                </div>

                <div class="p-8">
                    <ListingPreview :type="formType" :form="currentForm" />
                </div>

                <!-- Preview Navigation -->
                <div class="p-6 border-t border-gray-200 flex gap-4">
                    <button @click="prevStep"
                        class="flex-1 px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50 text-primary border-primary">
                        Editar
                    </button>
                    <button @click="publishListing"
                        class="flex-1 px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90 bg-secondary">
                        Confirmar y publicar
                    </button>
                </div>
            </div>

            <!-- Success Page -->
            <div v-if="published" class="text-center py-12">
                <div class="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg bg-linear-135 from-primary to-secondary">
                    <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"></path>
                    </svg>
                </div>

                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-3">Publicación creada con éxito</h1>
                <p class="text-gray-600 mb-8 max-w-md mx-auto">
                    Tu {{ publicationType === 'product' ? 'producto' : 'servicio' }} ya está visible en el catálogo de ProviDent.
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <RouterLink to="/mis-productos"
                        class="px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50 text-center text-primary border-primary">
                        Ver mis publicaciones
                    </RouterLink>
                    <button @click="goBackToStart" type="button"
                        class="px-6 py-3 text-white font-semibold rounded-lg transition bg-secondary-700 hover:bg-secondary-800">
                        Crear otra publicación
                    </button>
                </div>

                <p class="mt-8 text-sm text-gray-600">
                    Tip: los compradores confían más en perfiles completos.
                    <RouterLink to="/mi-perfil/editar" class="font-semibold text-primary-700 underline">Completá tu perfil</RouterLink>
                </p>
            </div>

            <ShippingMethodModal v-if="shippingModal" :method="shippingModal.method"
                @saved="onShippingSaved" @close="shippingModal = null" />
        </div>
    </section>
</template>
