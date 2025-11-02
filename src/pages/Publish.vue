<script>
import { subscribeToAuthStateChanges } from '../services/auth'
import { createSupplyProduct, createProsthesisProduct, createPlasterServiceProduct, createRentalProduct, listShippingMethods, createShippingMethod } from '../services/products'
import { isCurrentUserSeller } from '../services/sellers'

export default {
    name: 'Publish',
    data() {
        return {
            user: {
                id: null,
                email: null,
            },
            currentStep: 1,
            totalSteps: 4,
            publicationType: null, // 'product' or 'service'
            serviceType: null, // 'prosthesis', 'plaster', 'rental'

            // Product data
            productData: {
                name: '',
                description: '',
                images: [],
                imageFile: null,
                price: '',
                unit: 'unidad',
                unitCustom: '',
                stock: '',
                sku: '',
                shippingMethodId: null,
                newShippingMethodName: ''
            },
            shippingMethods: [],

            // Service data - Prosthesis
            prosthesisData: {
                name: '',
                description: '',
                material: '',
                images: [],
                imageFile: null,
                pricingMatrix: {
                    corona_total: { anterior: '', premolar: '', molar: '' },
                    carilla: { anterior: '', premolar: '', molar: '' },
                    incrustacion: { anterior: '', premolar: '', molar: '' },
                    puente: { anterior: '', premolar: '', molar: '' }
                },
                deliveryTime: ''
            },

            // Service data - Plaster
            plasterData: {
                name: '',
                description: '',
                images: [],
                imageFile: null,
                basePrice: '',
                deliveryTime: ''
            },

            // Service data - Rental
            rentalData: {
                name: '',
                description: '',
                images: [],
                imageFile: null,
                stock: '',
                priceDay: '',
                priceWeek: '',
                priceMonth: ''
            },

            previewMode: false,
            published: false,
            errorMessage: null,
            showShippingConfig: false
        }
    },
    computed: {
        progressPercentage() {
            return (this.currentStep / this.totalSteps) * 100
        },
        canProceed() {
            if (this.currentStep === 1) {
                return this.publicationType !== null
            }
            if (this.currentStep === 2 && this.publicationType === 'service') {
                return this.serviceType !== null
            }
            if (this.currentStep === 3) {
                return this.validateCurrentForm()
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

        validateCurrentForm() {
            if (this.publicationType === 'product') {
                const unitOk = this.productData.unit !== 'otro' || (this.productData.unit === 'otro' && this.productData.unitCustom && this.productData.unitCustom.trim().length > 0)
                return this.productData.name && this.productData.description &&
                       this.productData.price && this.productData.stock &&
                       this.productData.images.length > 0 && unitOk &&
                       (this.productData.shippingMethodId || (this.productData.newShippingMethodName && this.productData.newShippingMethodName.trim().length > 0))
            }

            if (this.serviceType === 'prosthesis') {
                // Verificar que haya al menos un precio en la matriz
                const hasPrice = Object.values(this.prosthesisData.pricingMatrix).some(workType =>
                    Object.values(workType).some(price => price && Number(price) > 0)
                )
                return this.prosthesisData.name && this.prosthesisData.description &&
                       this.prosthesisData.material && this.prosthesisData.images.length > 0 && hasPrice
            }

            if (this.serviceType === 'plaster') {
                return this.plasterData.name && this.plasterData.description &&
                       this.plasterData.basePrice && this.plasterData.images.length > 0
            }

            if (this.serviceType === 'rental') {
                // Al menos un precio debe estar completado
                const hasAtLeastOnePrice = this.rentalData.priceDay ||
                                          this.rentalData.priceWeek ||
                                          this.rentalData.priceMonth
                return this.rentalData.name && this.rentalData.description &&
                       this.rentalData.stock && hasAtLeastOnePrice && this.rentalData.images.length > 0
            }

            return false
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
            // Limpiar formularios
            this.productData = {
                name: '', description: '', images: [], imageFile: null,
                price: '', unit: 'unidad', unitCustom: '', stock: '', sku: '',
                shippingMethodId: null, newShippingMethodName: ''
            }
            this.prosthesisData = {
                name: '', description: '', material: '', images: [], imageFile: null,
                pricingMatrix: {
                    corona_total: { anterior: '', premolar: '', molar: '' },
                    carilla: { anterior: '', premolar: '', molar: '' },
                    incrustacion: { anterior: '', premolar: '', molar: '' },
                    puente: { anterior: '', premolar: '', molar: '' }
                },
                deliveryTime: ''
            }
            this.plasterData = {
                name: '', description: '', images: [], imageFile: null, basePrice: '',
                deliveryTime: ''
            }
            this.rentalData = {
                name: '', description: '', images: [], imageFile: null, stock: '',
                priceDay: '', priceWeek: '', priceMonth: ''
            }
        },

        handleImageUpload(event, dataType) {
            const files = event.target.files
            if (files.length > 0) {
                const file = files[0]
                const imageUrl = URL.createObjectURL(file)
                if (dataType === 'product') {
                    this.productData.imageFile = file
                    if (this.productData.images.length === 0) this.productData.images.push(imageUrl)
                    else this.productData.images.splice(0,1,imageUrl)
                } else if (dataType === 'prosthesis') {
                    this.prosthesisData.imageFile = file
                    if (this.prosthesisData.images.length === 0) this.prosthesisData.images.push(imageUrl)
                    else this.prosthesisData.images.splice(0,1,imageUrl)
                } else if (dataType === 'plaster') {
                    this.plasterData.imageFile = file
                    if (this.plasterData.images.length === 0) this.plasterData.images.push(imageUrl)
                    else this.plasterData.images.splice(0,1,imageUrl)
                } else if (dataType === 'rental') {
                    this.rentalData.imageFile = file
                    if (this.rentalData.images.length === 0) this.rentalData.images.push(imageUrl)
                    else this.rentalData.images.splice(0,1,imageUrl)
                }
            }
        },

        removeImage(index, dataType) {
            if (dataType === 'product') {
                this.productData.images.splice(index, 1)
            } else if (dataType === 'prosthesis') {
                this.prosthesisData.images.splice(index, 1)
            } else if (dataType === 'plaster') {
                this.plasterData.images.splice(index, 1)
            } else if (dataType === 'rental') {
                this.rentalData.images.splice(index, 1)
            }
        },

        

        async publishListing() {
            try {
                if (this.publicationType === 'product') {
                    const imageFile = this.productData.imageFile || null
                    if (!imageFile) {
                        this.showError('Debés agregar al menos una imagen')
                        return
                    }
                    const unit_label = this.productData.unit === 'otro' ? (this.productData.unitCustom || '').trim() : this.productData.unit
                    let methodId = this.productData.shippingMethodId
                    if (!methodId && this.productData.newShippingMethodName) {
                        methodId = await createShippingMethod(this.productData.newShippingMethodName.trim(), true)
                    }
                    if (!methodId) {
                        this.showError('Seleccioná o creá un método de envío')
                        return
                    }
                    await createSupplyProduct({
                        name: this.productData.name,
                        description: this.productData.description,
                        unit_price: Number(this.productData.price) || 0,
                        unit_label: unit_label || 'unidad',
                        stock_qty: Number(this.productData.stock) || null,
                        sku: this.productData.sku || null,
                        imageFile,
                        shipping_method_id: methodId,
                    })
                } else if (this.publicationType === 'service') {
                    if (this.serviceType === 'prosthesis') {
                        const imageFile = this.prosthesisData.imageFile || null
                        if (!imageFile) {
                            this.showError('Subí al menos una imagen')
                            return
                        }
                        await createProsthesisProduct({
                            name: this.prosthesisData.name,
                            description: this.prosthesisData.description,
                            imageFile,
                        })
                    } else if (this.serviceType === 'plaster') {
                        const imageFile = this.plasterData.imageFile || null
                        if (!imageFile) {
                            this.showError('Subí al menos una imagen')
                            return
                        }
                        await createPlasterServiceProduct({
                            name: this.plasterData.name,
                            description: this.plasterData.description,
                            base_price: Number(this.plasterData.basePrice) || 0,
                            imageFile,
                        })
                    } else if (this.serviceType === 'rental') {
                        const imageFile = this.rentalData.imageFile || null
                        if (!imageFile) {
                            this.showError('Subí al menos una imagen')
                            return
                        }
                        await createRentalProduct({
                            name: this.rentalData.name,
                            description: this.rentalData.description,
                            stock_qty: Number(this.rentalData.stock) || 0,
                            priceDay: Number(this.rentalData.priceDay) || null,
                            priceWeek: Number(this.rentalData.priceWeek) || null,
                            priceMonth: Number(this.rentalData.priceMonth) || null,
                            imageFile,
                        })
                    }
                }
                this.published = true
                this.currentStep = 4
            } catch (e) {
                this.showError('No se pudo publicar. Revisá los datos e intentá nuevamente.')
                console.error(e)
            }
        },
        async loadShippingMethods() {
            try {
                const list = await listShippingMethods()
                this.shippingMethods = list
                if (list.length && !this.productData.shippingMethodId) {
                    this.productData.shippingMethodId = list[0].id
                }
            } catch { this.shippingMethods = [] }
        },

        async quickCreateShippingMethod() {
            const name = (this.productData.newShippingMethodName || '').trim()
            if (!name) {
                this.showError('Ingresá un nombre para el método de envío')
                return
            }
            try {
                const id = await createShippingMethod(name, true)
                await this.loadShippingMethods()
                this.productData.shippingMethodId = id
                this.productData.newShippingMethodName = ''
                this.showShippingConfig = true
            } catch (e) {
                this.showError('No se pudo crear el método de envío')
            }
        },

        toggleShippingConfig() {
            const id = this.productData.shippingMethodId
            if (!id) {
                this.showError('Seleccioná un método de envío primero')
                return
            }
            this.showShippingConfig = !this.showShippingConfig
        },

        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        }
    },
    async mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
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
    <section class="min-h-screen bg-gray-50 pt-20 pb-12">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header -->
            <div v-if="!published" class="mb-8">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">Publicar en ProviDent</h1>
                <p class="text-gray-600">Seguí los pasos para crear tu publicación</p>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div class="flex items-start">
                    <svg class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <p class="text-sm text-red-800 font-medium">{{ errorMessage }}</p>
                </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="!published && !previewMode" class="mb-8">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold" style="color: #2A6FAF;">
                        Paso {{ currentStep }} de {{ totalSteps }}
                    </span>
                    <span class="text-sm font-semibold" style="color: #29A68C;">
                        {{ Math.round(progressPercentage) }}% completado
                    </span>
                </div>
                <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-300 rounded-full"
                        :style="{width: progressPercentage + '%', background: 'linear-gradient(90deg, #2A6FAF 0%, #29A68C 100%)'}">
                    </div>
                </div>
            </div>

            <!-- Step 1: Choose Publication Type -->
            <div v-if="currentStep === 1 && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                        <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        </svg>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">¿Qué querés publicar?</h2>
                    <p class="text-gray-600">Seleccioná el tipo de publicación que querés crear</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button @click="selectPublicationType('product')"
                        class="p-8 border-2 rounded-lg transition-all hover:shadow-lg group"
                        :class="publicationType === 'product' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary'"
                        style="border-color: #2A6FAF;">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all"
                            :style="{backgroundColor: publicationType === 'product' ? '#2A6FAF' : '#E3EEF8'}">
                            <svg class="w-8 h-8 transition-colors"
                                :class="publicationType === 'product' ? 'text-white' : 'text-primary'"
                                style="color: #2A6FAF;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                            </svg>
                        </div>
                        <h3 class="font-heading text-xl font-bold text-gray-800 mb-2">Producto</h3>
                        <p class="text-sm text-gray-600">Artículos físicos: resinas, instrumental, equipamiento, indumentaria</p>
                    </button>

                    <button @click="selectPublicationType('service')"
                        class="p-8 border-2 rounded-lg transition-all hover:shadow-lg group"
                        :class="publicationType === 'service' ? 'border-secondary bg-teal-50' : 'border-gray-200 hover:border-secondary'"
                        style="border-color: #29A68C;">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all"
                            :style="{backgroundColor: publicationType === 'service' ? '#29A68C' : '#D4F4EC'}">
                            <svg class="w-8 h-8 transition-colors"
                                :class="publicationType === 'service' ? 'text-white' : 'text-secondary'"
                                style="color: #29A68C;" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>
                            </svg>
                        </div>
                        <h3 class="font-heading text-xl font-bold text-gray-800 mb-2">Servicio</h3>
                        <p class="text-sm text-gray-600">Prótesis, modelado en yeso, alquiler de equipos</p>
                    </button>
                </div>
            </div>

            <!-- Step 2: Choose Service Type (only if service selected) -->
            <div v-if="currentStep === 2 && publicationType === 'service' && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="text-center mb-8">
                    <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">¿Qué tipo de servicio ofrecés?</h2>
                    <p class="text-gray-600">Elegí la categoría que mejor describa tu servicio</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button @click="selectServiceType('prosthesis')"
                        class="p-6 border-2 rounded-lg transition-all hover:shadow-lg"
                        :class="serviceType === 'prosthesis' ? 'bg-blue-50' : 'hover:border-primary'"
                        style="border-color: #2A6FAF;">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                            style="background-color: #E3EEF8;">
                            <svg class="w-6 h-6" style="color: #2A6FAF;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm-5 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"></path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 mb-1">Prótesis</h3>
                        <p class="text-xs text-gray-600">Piezas terminadas por encargo</p>
                    </button>

                    <button @click="selectServiceType('plaster')"
                        class="p-6 border-2 rounded-lg transition-all hover:shadow-lg"
                        :class="serviceType === 'plaster' ? 'bg-teal-50' : 'hover:border-secondary'"
                        style="border-color: #29A68C;">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                            style="background-color: #D4F4EC;">
                            <svg class="w-6 h-6" style="color: #29A68C;" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 mb-1">Modelado en yeso</h3>
                        <p class="text-xs text-gray-600">Vaciado y modelado</p>
                    </button>

                    <button @click="selectServiceType('rental')"
                        class="p-6 border-2 rounded-lg transition-all hover:shadow-lg"
                        :class="serviceType === 'rental' ? 'bg-coral-50' : 'hover:border-accent'"
                        style="border-color: #DC8C73;">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                            style="background-color: #F8E8E2;">
                            <svg class="w-6 h-6" style="color: #DC8C73;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 mb-1">Alquiler</h3>
                        <p class="text-xs text-gray-600">Equipos odontológicos</p>
                    </button>
                </div>

                <div class="mt-6 flex justify-center">
                    <button @click="prevStep"
                        class="px-6 py-2 border-2 font-semibold rounded-lg transition hover:bg-gray-50"
                        style="color: #2A6FAF; border-color: #2A6FAF;">
                        Volver
                    </button>
                </div>
            </div>

            <!-- Step 3: Product Form -->
            <div v-if="currentStep === 3 && publicationType === 'product' && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="p-4 rounded-lg mb-6" style="background-color: #E3EEF8;">
                    <h2 class="font-heading text-xl font-bold mb-2" style="color: #2A6FAF;">Datos del Producto</h2>
                    <p class="text-sm text-gray-600">Completá la información de tu producto</p>
                </div>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            📦 Nombre del producto *
                        </label>
                        <input type="text" v-model="productData.name" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Ej: Resina compuesta Universal A2" />
                    </div>

                    <div v-if="false">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🏷️ Marca o fabricante
                        </label>
                        <input type="text" v-model="productData.brand"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Ej: 3M, Kerr, Ivoclar" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            ✏️ Descripción detallada *
                        </label>
                        <textarea v-model="productData.description" required rows="4"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Describí las características, uso recomendado, contenido del paquete..."></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🖼️ Imágenes (mínimo una)
                        </label>
                        <div :class="['border-2 border-dashed rounded-lg p-6 text-center', productData.images.length ? 'border-gray-300' : 'border-red-400']">
                            <input type="file" ref="productImageInput" @change="handleImageUpload($event, 'product')" accept="image/*"
                                class="hidden" id="product-image-upload" />
                            <label for="product-image-upload" class="cursor-pointer">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <p class="text-sm text-gray-600">Hacé clic para subir o arrastrá la imagen aquí</p>
                                <p class="text-xs text-gray-500 mt-1">JPG, PNG o GIF (máx. 5MB)</p>
                                <p v-if="!productData.images.length" class="text-xs text-red-600 mt-2">Subí al menos una imagen</p>
                            </label>
                        </div>
                        <div v-if="productData.images.length > 0" class="grid grid-cols-3 gap-4 mt-4">
                            <div v-for="(image, index) in productData.images" :key="index" class="relative">
                                <img :src="image" class="w-full h-32 object-cover rounded-lg" />
                                <button @click="removeImage(index, 'product')" type="button"
                                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                💰 Precio unitario *
                            </label>
                            <div class="relative">
                                <span class="absolute left-4 top-3 text-gray-500">$</span>
                                <input type="number" v-model="productData.price" required step="0.01"
                                    class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                    style="focus:ring-color: #2A6FAF;"
                                    placeholder="0.00" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                ⚖️ Unidad de medida
                            </label>
                            <select v-model="productData.unit"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                style="focus:ring-color: #2A6FAF;">
                                <option value="unidad">Unidad</option>
                                <option value="caja">Caja</option>
                                <option value="kilo">Kilo</option>
                                <option value="litro">Litro</option>
                                <option value="metro">Metro</option>
                                <option value="pack">Pack</option>
                                <option value="otro">Otro...</option>
                            </select>
                            <input v-if="productData.unit === 'otro'" type="text" v-model="productData.unitCustom"
                                class="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                style="focus:ring-color: #2A6FAF;" placeholder="Especificá la unidad (ej: frasco, bolsa, kit)" />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                🔢 Stock disponible *
                            </label>
                            <input type="number" v-model="productData.stock" required min="1"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                style="focus:ring-color: #2A6FAF;"
                                placeholder="Cantidad disponible" />
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                🧾 SKU o código interno
                            </label>
                            <input type="text" v-model="productData.sku"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                style="focus:ring-color: #2A6FAF;"
                                placeholder="Ej: PROD-001" />
                        </div>
                    </div>

                    <div v-if="false">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            💳 Cuenta de cobro
                        </label>
                        <select v-model="productData.paymentAccount"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;">
                            <option value="">Seleccionar cuenta</option>
                            <option value="bank1">Cuenta Banco Nación - ...4567</option>
                            <option value="bank2">Cuenta Galicia - ...8901</option>
                            <option value="mp">Mercado Pago</option>
                        </select>
                    </div>

                    <div v-if="false">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            📍 Ubicación del producto
                        </label>
                        <input type="text" v-model="productData.location"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Ej: CABA, Buenos Aires" />
                    </div>

                    <!-- Shipping method selection/creation -->
                    <div class="mt-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🚚 Método de envío para este producto
                        </label>
                        <div v-if="shippingMethods.length > 0" class="space-y-3">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div class="md:col-span-2">
                                    <select v-model="productData.shippingMethodId"
                                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                            style="focus:ring-color: #2A6FAF;">
                                        <option :value="null">Seleccioná un método</option>
                                        <option v-for="sm in shippingMethods" :key="sm.id" :value="sm.id">{{ sm.name }} {{ sm.active ? '' : '(pausado)' }}</option>
                                    </select>
                                </div>
                                <div>
                                    <button type="button" @click="toggleShippingConfig" class="w-full px-4 py-3 border rounded-lg text-sky-700 border-sky-600 hover:bg-sky-50">
                                        {{ showShippingConfig ? 'Ocultar config' : 'Configurar' }}
                                    </button>
                                </div>
                            </div>

                            <!-- Collapsible shipping config -->
                            <div v-if="showShippingConfig" class="p-4 border-2 border-sky-200 rounded-lg bg-sky-50">
                                <p class="text-sm text-sky-900 mb-3">
                                    <strong>Nota:</strong> Configurá zonas y tarifas en una nueva pestaña para no perder tu progreso.
                                </p>
                                <div class="flex gap-2">
                                    <a :href="`/metodos-envio/${productData.shippingMethodId}`" target="_blank" rel="noopener noreferrer"
                                       class="px-4 py-2 text-sm bg-sky-600 text-white rounded hover:bg-sky-700 flex items-center gap-1">
                                        Abrir configuración
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                        </svg>
                                    </a>
                                    <button @click="showShippingConfig = false" class="px-3 py-2 text-sm border border-sky-600 text-sky-700 rounded hover:bg-sky-100">
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div v-else class="p-4 border rounded bg-yellow-50 text-yellow-800">
                            Aún no tenés métodos de envío. Creá uno para poder publicar.
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div class="md:col-span-2">
                                <label class="block text-sm text-gray-700 mb-1">Crear nuevo método</label>
                                <input v-model="productData.newShippingMethodName"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                       style="focus:ring-color: #2A6FAF;" placeholder="Nombre del método (ej: Envío estándar)" />
                            </div>
                            <div class="flex items-end">
                                <button type="button" @click="quickCreateShippingMethod" class="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Crear y configurar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 3: Prosthesis Form -->
            <div v-if="currentStep === 3 && serviceType === 'prosthesis' && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="p-4 rounded-lg mb-6" style="background-color: #E3EEF8;">
                    <h2 class="font-heading text-xl font-bold mb-2" style="color: #2A6FAF;">Servicio de Prótesis</h2>
                    <p class="text-sm text-gray-600">Configurá tu servicio y matriz de precios</p>
                </div>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre del servicio *
                        </label>
                        <input type="text" v-model="prosthesisData.name" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Ej: Prótesis fijas cerámicas" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Descripción *
                        </label>
                        <textarea v-model="prosthesisData.description" required rows="3"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Describí tu servicio, materiales, garantías..."></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🖼️ Imágenes (mínimo una) *
                        </label>
                        <div :class="['border-2 border-dashed rounded-lg p-6 text-center', prosthesisData.images.length ? 'border-gray-300' : 'border-red-400']">
                            <input type="file" ref="prosthesisImageInput" @change="handleImageUpload($event, 'prosthesis')" accept="image/*"
                                class="hidden" id="prosthesis-image-upload" />
                            <label for="prosthesis-image-upload" class="cursor-pointer">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <p class="text-sm text-gray-600">Hacé clic para subir o arrastrá la imagen aquí</p>
                                <p class="text-xs text-gray-500 mt-1">JPG, PNG o GIF (máx. 5MB)</p>
                                <p v-if="!prosthesisData.images.length" class="text-xs text-red-600 mt-2">Subí al menos una imagen</p>
                            </label>
                        </div>
                        <div v-if="prosthesisData.images.length > 0" class="grid grid-cols-3 gap-4 mt-4">
                            <div v-for="(image, index) in prosthesisData.images" :key="index" class="relative">
                                <img :src="image" class="w-full h-32 object-cover rounded-lg" />
                                <button @click="removeImage(index, 'prosthesis')" type="button"
                                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Material principal *
                        </label>
                        <input type="text" v-model="prosthesisData.material" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Ej: Zirconio, Porcelana, Metal-porcelana" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-3">
                            Matriz de Precios (por tipo de trabajo y grupo dentario)
                        </label>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr style="background-color: #E3EEF8;">
                                        <th class="border border-gray-300 px-4 py-2 text-left font-semibold" style="color: #2A6FAF;">Tipo de trabajo</th>
                                        <th class="border border-gray-300 px-4 py-2 text-center font-semibold" style="color: #2A6FAF;">Anterior</th>
                                        <th class="border border-gray-300 px-4 py-2 text-center font-semibold" style="color: #2A6FAF;">Premolar</th>
                                        <th class="border border-gray-300 px-4 py-2 text-center font-semibold" style="color: #2A6FAF;">Molar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="border border-gray-300 px-4 py-2 font-semibold">Corona total</td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.corona_total.anterior" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.corona_total.premolar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.corona_total.molar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="border border-gray-300 px-4 py-2 font-semibold">Carilla</td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.carilla.anterior" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.carilla.premolar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.carilla.molar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="border border-gray-300 px-4 py-2 font-semibold">Incrustación</td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.incrustacion.anterior" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.incrustacion.premolar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.incrustacion.molar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="border border-gray-300 px-4 py-2 font-semibold">Puente</td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.puente.anterior" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.puente.premolar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input type="number" v-model="prosthesisData.pricingMatrix.puente.molar" step="0.01"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="$" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Tiempo de entrega (días hábiles)
                        </label>
                        <input type="number" v-model="prosthesisData.deliveryTime" min="1"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="Ej: 5" />
                    </div>

                    
                </div>
            </div>

            <!-- Step 3: Plaster Form -->
            <div v-if="currentStep === 3 && serviceType === 'plaster' && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="p-4 rounded-lg mb-6" style="background-color: #D4F4EC;">
                    <h2 class="font-heading text-xl font-bold mb-2" style="color: #29A68C;">Modelado en Yeso</h2>
                    <p class="text-sm text-gray-600">Configurá tu servicio de vaciado y modelado</p>
                </div>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre del servicio *
                        </label>
                        <input type="text" v-model="plasterData.name" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #29A68C;"
                            placeholder="Ej: Modelado en yeso tipo III" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Descripción *
                        </label>
                        <textarea v-model="plasterData.description" required rows="4"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #29A68C;"
                            placeholder="Describí el tipo de modelado, uso de articulador, recorte, etc..."></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🖼️ Imágenes (mínimo una) *
                        </label>
                        <div :class="['border-2 border-dashed rounded-lg p-6 text-center', plasterData.images.length ? 'border-gray-300' : 'border-red-400']">
                            <input type="file" ref="plasterImageInput" @change="handleImageUpload($event, 'plaster')" accept="image/*"
                                class="hidden" id="plaster-image-upload" />
                            <label for="plaster-image-upload" class="cursor-pointer">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <p class="text-sm text-gray-600">Hacé clic para subir o arrastrá la imagen aquí</p>
                                <p class="text-xs text-gray-500 mt-1">JPG, PNG o GIF (máx. 5MB)</p>
                                <p v-if="!plasterData.images.length" class="text-xs text-red-600 mt-2">Subí al menos una imagen</p>
                            </label>
                        </div>
                        <div v-if="plasterData.images.length > 0" class="grid grid-cols-3 gap-4 mt-4">
                            <div v-for="(image, index) in plasterData.images" :key="index" class="relative">
                                <img :src="image" class="w-full h-32 object-cover rounded-lg" />
                                <button @click="removeImage(index, 'plaster')" type="button"
                                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            💰 Precio base *
                        </label>
                        <div class="relative">
                            <span class="absolute left-4 top-3 text-gray-500">$</span>
                            <input type="number" v-model="plasterData.basePrice" required step="0.01"
                                class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                style="focus:ring-color: #29A68C;"
                                placeholder="0.00" />
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Precio por modelo completo (superior e inferior)</p>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Tiempo de entrega (días hábiles)
                        </label>
                        <input type="number" v-model="plasterData.deliveryTime" min="1"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #29A68C;"
                            placeholder="Ej: 2" />
                    </div>

                    
                </div>
            </div>

            <!-- Step 3: Rental Form -->
            <div v-if="currentStep === 3 && serviceType === 'rental' && !previewMode" class="bg-white rounded-lg shadow-md p-8">
                <div class="p-4 rounded-lg mb-6" style="background-color: #F8E8E2;">
                    <h2 class="font-heading text-xl font-bold mb-2" style="color: #DC8C73;">Alquiler de Equipos</h2>
                    <p class="text-sm text-gray-600">Configurá tu servicio de alquiler</p>
                </div>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre del equipo *
                        </label>
                        <input type="text" v-model="rentalData.name" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #DC8C73;"
                            placeholder="Ej: Compresor dental portátil" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Descripción *
                        </label>
                        <textarea v-model="rentalData.description" required rows="4"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #DC8C73;"
                            placeholder="Describí el equipo, estado, características técnicas..."></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🖼️ Imágenes (mínimo una) *
                        </label>
                        <div :class="['border-2 border-dashed rounded-lg p-6 text-center', rentalData.images.length ? 'border-gray-300' : 'border-red-400']">
                            <input type="file" ref="rentalImageInput" @change="handleImageUpload($event, 'rental')" accept="image/*"
                                class="hidden" id="rental-image-upload" />
                            <label for="rental-image-upload" class="cursor-pointer">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <p class="text-sm text-gray-600">Hacé clic para subir o arrastrá la imagen aquí</p>
                                <p class="text-xs text-gray-500 mt-1">JPG, PNG o GIF (máx. 5MB)</p>
                                <p v-if="!rentalData.images.length" class="text-xs text-red-600 mt-2">Subí al menos una imagen</p>
                            </label>
                        </div>
                        <div v-if="rentalData.images.length > 0" class="grid grid-cols-3 gap-4 mt-4">
                            <div v-for="(image, index) in rentalData.images" :key="index" class="relative">
                                <img :src="image" class="w-full h-32 object-cover rounded-lg" />
                                <button @click="removeImage(index, 'rental')" type="button"
                                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Unidades disponibles *
                        </label>
                        <input type="number" v-model="rentalData.stock" required min="1"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #DC8C73;"
                            placeholder="Cantidad de equipos" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-3">
                            Garantía del equipo
                        </label>
                        <div class="space-y-3">
                            <label class="flex items-center">
                                <input type="radio" v-model="rentalData.insuranceType" value="deposit" class="mr-3" />
                                <span class="text-sm text-gray-700">Depósito en garantía (se devuelve al finalizar)</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" v-model="rentalData.insuranceType" value="insurance" class="mr-3" />
                                <span class="text-sm text-gray-700">Seguro contra daños (requiere póliza)</span>
                            </label>
                        </div>
                    </div>

                    <div v-if="rentalData.insuranceType === 'deposit'">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Monto del depósito
                        </label>
                        <div class="relative">
                            <span class="absolute left-4 top-3 text-gray-500">$</span>
                            <input type="number" v-model="rentalData.depositAmount" step="0.01"
                                class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                style="focus:ring-color: #DC8C73;"
                                placeholder="0.00" />
                        </div>
                    </div>

                    <div v-if="rentalData.insuranceType === 'insurance'">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            📄 Archivo de póliza de seguro
                        </label>
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <input type="file" @change="handleInsuranceFileUpload"
                                accept=".pdf,.doc,.docx" class="hidden" id="insurance-file-upload" />
                            <label for="insurance-file-upload" class="cursor-pointer block text-center">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-600">Hacé clic para subir la póliza</p>
                                <p class="text-xs text-gray-500 mt-1">PDF, DOC o DOCX (máx. 10MB)</p>
                            </label>
                        </div>
                        <div v-if="rentalData.insuranceFile" class="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <svg class="w-8 h-8" style="color: #DC8C73;" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
                                </svg>
                                <div>
                                    <p class="text-sm font-semibold text-gray-800">{{ rentalData.insuranceFile.name }}</p>
                                    <p class="text-xs text-gray-500">{{ (rentalData.insuranceFile.size / 1024).toFixed(2) }} KB</p>
                                </div>
                            </div>
                            <button @click="removeInsuranceFile" type="button"
                                class="text-red-500 hover:text-red-700 transition">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Precios de alquiler *
                        </label>
                        <p class="text-xs text-gray-500 mb-3">Completá al menos una opción de precio</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Por día</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                    <input type="number" v-model="rentalData.priceDay" step="0.01"
                                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                        style="focus:ring-color: #DC8C73;"
                                        placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Por semana</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                    <input type="number" v-model="rentalData.priceWeek" step="0.01"
                                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                        style="focus:ring-color: #DC8C73;"
                                        placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Por mes</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                    <input type="number" v-model="rentalData.priceMonth" step="0.01"
                                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                        style="focus:ring-color: #DC8C73;"
                                        placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                    </div>

                    

                    
                </div>
            </div>

            <!-- Navigation Buttons for Step 3 forms -->
            <div v-if="currentStep === 3 && !previewMode" class="mt-6 flex gap-4">
                <button @click="prevStep"
                    class="flex-1 px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50"
                    style="color: #2A6FAF; border-color: #2A6FAF;">
                    Anterior
                </button>
                <button @click="nextStep" :disabled="!canProceed"
                    class="flex-1 px-6 py-3 text-white font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    style="background-color: #29A68C;">
                    Ver preview
                </button>
            </div>

            <!-- Preview Page -->
            <div v-if="previewMode && !published" class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="p-4" style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                    <h2 class="font-heading text-xl font-bold text-white mb-1">Preview de tu publicación</h2>
                    <p class="text-sm text-white opacity-90">Revisá que todo esté correcto antes de publicar</p>
                </div>

                <div class="p-8">
                    <!-- Product Preview -->
                    <div v-if="publicationType === 'product'" class="space-y-6">
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Tipo de publicación</h3>
                            <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white"
                                style="background-color: #2A6FAF;">
                                Producto
                            </span>
                        </div>

                        <div v-if="productData.images.length > 0">
                            <h3 class="font-semibold text-gray-700 mb-2">Imágenes</h3>
                            <div class="grid grid-cols-4 gap-4">
                                <img v-for="(image, index) in productData.images" :key="index"
                                    :src="image" class="w-full h-24 object-cover rounded-lg" />
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Información básica</h3>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span class="font-semibold">Nombre:</span> {{ productData.name }}</p>
                                <p v-if="productData.brand"><span class="font-semibold">Marca:</span> {{ productData.brand }}</p>
                                <p><span class="font-semibold">Descripción:</span> {{ productData.description }}</p>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Precio y stock</h3>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span class="font-semibold">Precio:</span> ${{ formatPrice(productData.price) }} por {{ productData.unit }}</p>
                                <p><span class="font-semibold">Stock:</span> {{ productData.stock }} unidades</p>
                                <p v-if="productData.sku"><span class="font-semibold">SKU:</span> {{ productData.sku }}</p>
                            </div>
                        </div>

                        <div v-if="productData.location">
                            <h3 class="font-semibold text-gray-700 mb-2">Ubicación</h3>
                            <p class="bg-gray-50 rounded-lg p-4">{{ productData.location }}</p>
                        </div>
                    </div>

                    <!-- Prosthesis Preview -->
                    <div v-if="serviceType === 'prosthesis'" class="space-y-6">
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Tipo de publicación</h3>
                            <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white"
                                style="background-color: #2A6FAF;">
                                Servicio: Prótesis
                            </span>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Información del servicio</h3>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span class="font-semibold">Nombre:</span> {{ prosthesisData.name }}</p>
                                <p><span class="font-semibold">Material:</span> {{ prosthesisData.material }}</p>
                                <p><span class="font-semibold">Descripción:</span> {{ prosthesisData.description }}</p>
                                <p v-if="prosthesisData.deliveryTime"><span class="font-semibold">Tiempo de entrega:</span> {{ prosthesisData.deliveryTime }} días hábiles</p>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-3">Matriz de precios</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr style="background-color: #E3EEF8;">
                                            <th class="border border-gray-300 px-4 py-2 text-left font-semibold" style="color: #2A6FAF;">Tipo de trabajo</th>
                                            <th class="border border-gray-300 px-4 py-2 text-center font-semibold" style="color: #2A6FAF;">Anterior</th>
                                            <th class="border border-gray-300 px-4 py-2 text-center font-semibold" style="color: #2A6FAF;">Premolar</th>
                                            <th class="border border-gray-300 px-4 py-2 text-center font-semibold" style="color: #2A6FAF;">Molar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="border border-gray-300 px-4 py-2 font-semibold">Corona total</td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.corona_total.anterior ? '$' + formatPrice(prosthesisData.pricingMatrix.corona_total.anterior) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.corona_total.premolar ? '$' + formatPrice(prosthesisData.pricingMatrix.corona_total.premolar) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.corona_total.molar ? '$' + formatPrice(prosthesisData.pricingMatrix.corona_total.molar) : '-' }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="border border-gray-300 px-4 py-2 font-semibold">Carilla</td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.carilla.anterior ? '$' + formatPrice(prosthesisData.pricingMatrix.carilla.anterior) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.carilla.premolar ? '$' + formatPrice(prosthesisData.pricingMatrix.carilla.premolar) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.carilla.molar ? '$' + formatPrice(prosthesisData.pricingMatrix.carilla.molar) : '-' }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="border border-gray-300 px-4 py-2 font-semibold">Incrustación</td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.incrustacion.anterior ? '$' + formatPrice(prosthesisData.pricingMatrix.incrustacion.anterior) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.incrustacion.premolar ? '$' + formatPrice(prosthesisData.pricingMatrix.incrustacion.premolar) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.incrustacion.molar ? '$' + formatPrice(prosthesisData.pricingMatrix.incrustacion.molar) : '-' }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="border border-gray-300 px-4 py-2 font-semibold">Puente</td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.puente.anterior ? '$' + formatPrice(prosthesisData.pricingMatrix.puente.anterior) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.puente.premolar ? '$' + formatPrice(prosthesisData.pricingMatrix.puente.premolar) : '-' }}
                                            </td>
                                            <td class="border border-gray-300 px-4 py-2 text-center">
                                                {{ prosthesisData.pricingMatrix.puente.molar ? '$' + formatPrice(prosthesisData.pricingMatrix.puente.molar) : '-' }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div v-if="prosthesisData.location">
                            <h3 class="font-semibold text-gray-700 mb-2">Ubicación</h3>
                            <p class="bg-gray-50 rounded-lg p-4">{{ prosthesisData.location }}</p>
                        </div>
                    </div>

                    <!-- Plaster Preview -->
                    <div v-if="serviceType === 'plaster'" class="space-y-6">
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Tipo de publicación</h3>
                            <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white"
                                style="background-color: #29A68C;">
                                Servicio: Modelado en Yeso
                            </span>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Información del servicio</h3>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span class="font-semibold">Nombre:</span> {{ plasterData.name }}</p>
                                <p><span class="font-semibold">Descripción:</span> {{ plasterData.description }}</p>
                                <p><span class="font-semibold">Precio:</span> ${{ formatPrice(plasterData.basePrice) }}</p>
                                <p v-if="plasterData.deliveryTime"><span class="font-semibold">Tiempo de entrega:</span> {{ plasterData.deliveryTime }} días hábiles</p>
                            </div>
                        </div>

                        <div v-if="plasterData.location">
                            <h3 class="font-semibold text-gray-700 mb-2">Ubicación</h3>
                            <p class="bg-gray-50 rounded-lg p-4">{{ plasterData.location }}</p>
                        </div>
                    </div>

                    <!-- Rental Preview -->
                    <div v-if="serviceType === 'rental'" class="space-y-6">
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Tipo de publicación</h3>
                            <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white"
                                style="background-color: #DC8C73;">
                                Servicio: Alquiler de Equipos
                            </span>
                        </div>

                        <div v-if="rentalData.images.length > 0">
                            <h3 class="font-semibold text-gray-700 mb-2">Imágenes</h3>
                            <div class="grid grid-cols-4 gap-4">
                                <img v-for="(image, index) in rentalData.images" :key="index"
                                    :src="image" class="w-full h-24 object-cover rounded-lg" />
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Información del equipo</h3>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span class="font-semibold">Nombre:</span> {{ rentalData.name }}</p>
                                <p><span class="font-semibold">Descripción:</span> {{ rentalData.description }}</p>
                                <p><span class="font-semibold">Stock disponible:</span> {{ rentalData.stock }} unidades</p>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Precios de alquiler</h3>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="grid gap-4 text-center"
                                    :class="{
                                        'grid-cols-1': [rentalData.priceDay, rentalData.priceWeek, rentalData.priceMonth].filter(Boolean).length === 1,
                                        'grid-cols-2': [rentalData.priceDay, rentalData.priceWeek, rentalData.priceMonth].filter(Boolean).length === 2,
                                        'grid-cols-3': [rentalData.priceDay, rentalData.priceWeek, rentalData.priceMonth].filter(Boolean).length === 3
                                    }">
                                    <div v-if="rentalData.priceDay">
                                        <p class="text-xs text-gray-600 mb-1">Por día</p>
                                        <p class="text-lg font-bold" style="color: #DC8C73;">${{ formatPrice(rentalData.priceDay) }}</p>
                                    </div>
                                    <div v-if="rentalData.priceWeek">
                                        <p class="text-xs text-gray-600 mb-1">Por semana</p>
                                        <p class="text-lg font-bold" style="color: #DC8C73;">${{ formatPrice(rentalData.priceWeek) }}</p>
                                    </div>
                                    <div v-if="rentalData.priceMonth">
                                        <p class="text-xs text-gray-600 mb-1">Por mes</p>
                                        <p class="text-lg font-bold" style="color: #DC8C73;">${{ formatPrice(rentalData.priceMonth) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-700 mb-2">Garantía</h3>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p v-if="rentalData.insuranceType === 'deposit'">
                                    <span class="font-semibold">Depósito en garantía:</span> ${{ formatPrice(rentalData.depositAmount) }}
                                </p>
                                <div v-else>
                                    <p class="mb-2"><span class="font-semibold">Tipo:</span> Seguro contra daños</p>
                                    <div v-if="rentalData.insuranceFile" class="flex items-center gap-2 text-sm">
                                        <svg class="w-5 h-5" style="color: #DC8C73;" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span>{{ rentalData.insuranceFile.name }}</span>
                                        <span class="text-gray-500">({{ (rentalData.insuranceFile.size / 1024).toFixed(2) }} KB)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="rentalData.location">
                            <h3 class="font-semibold text-gray-700 mb-2">Ubicación</h3>
                            <p class="bg-gray-50 rounded-lg p-4">{{ rentalData.location }}</p>
                        </div>
                    </div>
                </div>

                <!-- Preview Navigation -->
                <div class="p-6 border-t border-gray-200 flex gap-4">
                    <button @click="prevStep"
                        class="flex-1 px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50"
                        style="color: #2A6FAF; border-color: #2A6FAF;">
                        Editar
                    </button>
                    <button @click="publishListing"
                        class="flex-1 px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
                        style="background-color: #29A68C;">
                        Confirmar y publicar
                    </button>
                </div>
            </div>

            <!-- Success Page -->
            <div v-if="published" class="text-center py-12">
                <div class="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
                    style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                    <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>

                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-3">Publicación creada con éxito</h1>
                <p class="text-gray-600 mb-8 max-w-md mx-auto">
                    Tu {{ publicationType === 'product' ? 'producto' : 'servicio' }} ya está visible en ProviDent.
                    Los compradores podrán encontrarlo y contactarte.
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <RouterLink to="/mis-productos"
                        class="px-6 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50 text-center"
                        style="color: #2A6FAF; border-color: #2A6FAF;">
                        Ver mis publicaciones
                    </RouterLink>
                    <button @click="goBackToStart"
                        class="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
                        style="background-color: #29A68C;">
                        Crear otra publicación
                    </button>
                </div>

                <div class="mt-12 bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
                    <h3 class="font-heading text-lg font-bold text-gray-800 mb-4">Próximos pasos</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div class="p-4 rounded-lg" style="background-color: #E3EEF8;">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                                style="background-color: #2A6FAF;">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                </svg>
                            </div>
                            <h4 class="font-semibold text-gray-800 mb-1">Revisá mensajes</h4>
                            <p class="text-xs text-gray-600">Respondé consultas rápidamente</p>
                        </div>
                        <div class="p-4 rounded-lg" style="background-color: #D4F4EC;">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                                style="background-color: #29A68C;">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <h4 class="font-semibold text-gray-800 mb-1">Completá tu perfil</h4>
                            <p class="text-xs text-gray-600">Aumentá la confianza de compradores</p>
                        </div>
                        <div class="p-4 rounded-lg" style="background-color: #F8E8E2;">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                                style="background-color: #DC8C73;">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                                </svg>
                            </div>
                            <h4 class="font-semibold text-gray-800 mb-1">Compartí tu publicación</h4>
                            <p class="text-xs text-gray-600">Promocioná en redes sociales</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
