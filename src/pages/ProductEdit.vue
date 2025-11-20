<script>
import { subscribeToAuthStateChanges } from '../services/auth'
import {
    getProductById,
    updateSupplyProduct,
    updateProsthesisProduct,
    updatePlasterServiceProduct,
    updateRentalProduct,
    listShippingMethods,
    loadMaterials,
    loadWorkTypes,
    loadToothGroups,
    loadValidWorkGroupCombinations
} from '../services/products'

export default {
    name: 'ProductEdit',
    data() {
        return {
            user: { id: null, email: null },
            product: null,
            loading: true,
            saving: false,
            productType: null, // 'SUPPLY', 'PROSTHESIS', 'PLASTER_SERVICE', 'RENTAL'

            // Data for SUPPLY products
            supplyData: {
                name: '',
                description: '',
                imageFile: null,
                imagePreview: null,
                price: '',
                unit: 'unidad',
                unitCustom: '',
                stock: '',
                sku: '',
                is_active: true
            },

            // Data for PROSTHESIS products
            prosthesisData: {
                name: '',
                description: '',
                material: '',
                imageFile: null,
                imagePreview: null,
                pricingMatrix: {
                    corona_total: { anterior: '', premolar: '', molar: '' },
                    carilla: { anterior: '', premolar: '', molar: '' },
                    incrustacion: { anterior: '', premolar: '', molar: '' },
                    puente: { anterior: '', premolar: '', molar: '' }
                },
                deliveryTime: '',
                is_active: true
            },
            materials: [],

            // Data for PLASTER_SERVICE products
            plasterData: {
                name: '',
                description: '',
                imageFile: null,
                imagePreview: null,
                basePrice: '',
                deliveryTime: '',
                is_active: true
            },

            // Data for RENTAL products
            rentalData: {
                name: '',
                description: '',
                imageFile: null,
                imagePreview: null,
                stock: '',
                priceDay: '',
                priceWeek: '',
                priceMonth: '',
                is_active: true
            },

            errorMessage: null,
            successMessage: null,

            // Catalogs for validation
            workTypes: [],
            toothGroups: [],
            validCombinations: []
        }
    },
    computed: {
        workTypeLabels() {
            return {
                corona_total: 'Corona Total',
                carilla: 'Carilla',
                incrustacion: 'Incrustación',
                puente: 'Puente'
            }
        },
        groupLabels() {
            return {
                anterior: 'Anterior',
                premolar: 'Premolar',
                molar: 'Molar'
            }
        },
        canSave() {
            if (this.productType === 'SUPPLY') {
                const unitOk = this.supplyData.unit !== 'otro' ||
                              (this.supplyData.unit === 'otro' && this.supplyData.unitCustom && this.supplyData.unitCustom.trim().length > 0)
                return this.supplyData.name.trim() && this.supplyData.description.trim() &&
                       this.supplyData.price && this.supplyData.stock && unitOk
            }

            if (this.productType === 'PROSTHESIS') {
                const hasPrice = Object.values(this.prosthesisData.pricingMatrix).some(workType =>
                    Object.values(workType).some(price => price && Number(price) > 0)
                )
                return this.prosthesisData.name.trim() && this.prosthesisData.description.trim() &&
                       this.prosthesisData.material && hasPrice
            }

            if (this.productType === 'PLASTER_SERVICE') {
                return this.plasterData.name.trim() && this.plasterData.description.trim() &&
                       this.plasterData.basePrice
            }

            if (this.productType === 'RENTAL') {
                const hasAtLeastOnePrice = this.rentalData.priceDay ||
                                          this.rentalData.priceWeek ||
                                          this.rentalData.priceMonth
                return this.rentalData.name.trim() && this.rentalData.description.trim() &&
                       this.rentalData.stock && hasAtLeastOnePrice
            }

            return false
        }
    },
    methods: {
        async loadProduct() {
            try {
                this.loading = true
                const id = this.$route.params.id
                const product = await getProductById(id)

                if (!product) {
                    this.errorMessage = 'Producto no encontrado'
                    return
                }

                this.product = product
                this.productType = product.product_type

                // Load type-specific data
                if (this.productType === 'SUPPLY') {
                    await this.loadSupplyData(product)
                } else if (this.productType === 'PROSTHESIS') {
                    await this.loadProsthesisData(product)
                } else if (this.productType === 'PLASTER_SERVICE') {
                    await this.loadPlasterData(product)
                } else if (this.productType === 'RENTAL') {
                    await this.loadRentalData(product)
                }
            } catch (e) {
                console.error('Error loading product:', e)
                this.errorMessage = 'Error al cargar el producto'
            } finally {
                this.loading = false
            }
        },

        async loadSupplyData(product) {
            this.supplyData.name = product.name
            this.supplyData.description = product.description
            this.supplyData.price = product.price
            this.supplyData.stock = product.stock
            this.supplyData.sku = product.sku || ''
            this.supplyData.is_active = product.is_active !== false
            this.supplyData.imagePreview = product.image

            // Handle unit
            const standardUnits = ['unidad', 'kg', 'g', 'l', 'ml', 'metro']
            if (standardUnits.includes(product.unit)) {
                this.supplyData.unit = product.unit
            } else {
                this.supplyData.unit = 'otro'
                this.supplyData.unitCustom = product.unit || ''
            }
        },

        async loadProsthesisData(product) {
            this.prosthesisData.name = product.name
            this.prosthesisData.description = product.description
            this.prosthesisData.material = product.material_id || ''
            this.prosthesisData.is_active = product.is_active !== false
            this.prosthesisData.imagePreview = product.image
            this.prosthesisData.deliveryTime = product.manufacturing_days || ''

            // Reset pricing matrix first
            Object.keys(this.prosthesisData.pricingMatrix).forEach(workType => {
                Object.keys(this.prosthesisData.pricingMatrix[workType]).forEach(group => {
                    this.prosthesisData.pricingMatrix[workType][group] = ''
                })
            })

            // Load pricing matrix from product.pricing_matrix
            if (product.pricing_matrix && product.pricing_matrix.length > 0) {
                // Load catalogs to map UUIDs back to names
                const workTypes = await loadWorkTypes()
                const toothGroups = await loadToothGroups()

                // Create reverse maps (ID -> name key)
                const workTypeIdToKey = {}
                workTypes.forEach(wt => {
                    const name = wt.name.toLowerCase()
                    if (name.includes('corona')) workTypeIdToKey[wt.id] = 'corona_total'
                    else if (name.includes('carilla')) workTypeIdToKey[wt.id] = 'carilla'
                    else if (name.includes('incrusta')) workTypeIdToKey[wt.id] = 'incrustacion'
                    else if (name.includes('puente')) workTypeIdToKey[wt.id] = 'puente'
                })

                const groupIdToKey = {}
                toothGroups.forEach(tg => {
                    const name = tg.name.toLowerCase()
                    if (name.includes('anterior')) groupIdToKey[tg.id] = 'anterior'
                    else if (name.includes('premolar')) groupIdToKey[tg.id] = 'premolar'
                    else if (name.includes('molar') && !name.includes('premolar')) groupIdToKey[tg.id] = 'molar'
                })

                // Fill the pricing matrix
                product.pricing_matrix.forEach(price => {
                    const workTypeKey = workTypeIdToKey[price.work_type_id]
                    const groupKey = groupIdToKey[price.tooth_group_id]

                    if (workTypeKey && groupKey && this.prosthesisData.pricingMatrix[workTypeKey]) {
                        this.prosthesisData.pricingMatrix[workTypeKey][groupKey] = price.unit_price
                    }
                })
            }

            this.materials = await loadMaterials()
        },

        async loadPlasterData(product) {
            this.plasterData.name = product.name
            this.plasterData.description = product.description
            this.plasterData.basePrice = product.price || product.base_price
            this.plasterData.is_active = product.is_active !== false
            this.plasterData.imagePreview = product.image
            this.plasterData.deliveryTime = product.manufacturing_days || ''
        },

        async loadRentalData(product) {
            this.rentalData.name = product.name
            this.rentalData.description = product.description
            this.rentalData.stock = product.stock
            this.rentalData.is_active = product.is_active !== false
            this.rentalData.imagePreview = product.image

            // Load rental pricing
            if (product.rental_pricing && product.rental_pricing.length > 0) {
                product.rental_pricing.forEach(rp => {
                    if (rp.period === 'DAY') this.rentalData.priceDay = rp.price
                    if (rp.period === 'WEEK') this.rentalData.priceWeek = rp.price
                    if (rp.period === 'MONTH') this.rentalData.priceMonth = rp.price
                })
            }
        },

        handleImageChange(e) {
            const file = e.target.files[0]
            if (!file) return

            if (this.productType === 'SUPPLY') {
                this.supplyData.imageFile = file
                this.supplyData.imagePreview = URL.createObjectURL(file)
            } else if (this.productType === 'PROSTHESIS') {
                this.prosthesisData.imageFile = file
                this.prosthesisData.imagePreview = URL.createObjectURL(file)
            } else if (this.productType === 'PLASTER_SERVICE') {
                this.plasterData.imageFile = file
                this.plasterData.imagePreview = URL.createObjectURL(file)
            } else if (this.productType === 'RENTAL') {
                this.rentalData.imageFile = file
                this.rentalData.imagePreview = URL.createObjectURL(file)
            }
        },

        async saveChanges() {
            if (!this.canSave) {
                this.errorMessage = 'Completá los campos obligatorios'
                return
            }

            try {
                this.saving = true
                this.errorMessage = null

                if (this.productType === 'SUPPLY') {
                    await this.saveSupplyProduct()
                } else if (this.productType === 'PROSTHESIS') {
                    await this.saveProsthesisProduct()
                } else if (this.productType === 'PLASTER_SERVICE') {
                    await this.savePlasterProduct()
                } else if (this.productType === 'RENTAL') {
                    await this.saveRentalProduct()
                }

                this.successMessage = 'Producto actualizado correctamente'
                setTimeout(() => {
                    this.$router.push('/mis-productos')
                }, 1500)
            } catch (e) {
                console.error('Error saving:', e)
                this.errorMessage = `Error al guardar: ${e?.message || String(e)}`
            } finally {
                this.saving = false
            }
        },

        async saveSupplyProduct() {
            const unit = this.supplyData.unit === 'otro' ? this.supplyData.unitCustom : this.supplyData.unit

            await updateSupplyProduct(this.product.id, {
                name: this.supplyData.name,
                description: this.supplyData.description,
                unit_price: parseFloat(this.supplyData.price),
                unit_label: unit,
                stock_qty: parseInt(this.supplyData.stock, 10),
                sku: this.supplyData.sku || null,
                imageFile: this.supplyData.imageFile,
                is_active: this.supplyData.is_active
            })
        },

        async saveProsthesisProduct() {
            await updateProsthesisProduct(this.product.id, {
                name: this.prosthesisData.name,
                description: this.prosthesisData.description,
                materialId: this.prosthesisData.material || null,
                pricingMatrix: this.prosthesisData.pricingMatrix,
                deliveryTime: this.prosthesisData.deliveryTime,
                imageFile: this.prosthesisData.imageFile,
                is_active: this.prosthesisData.is_active
            })
        },

        async savePlasterProduct() {
            await updatePlasterServiceProduct(this.product.id, {
                name: this.plasterData.name,
                description: this.plasterData.description,
                base_price: parseFloat(this.plasterData.basePrice),
                deliveryTime: this.plasterData.deliveryTime,
                imageFile: this.plasterData.imageFile,
                is_active: this.plasterData.is_active
            })
        },

        async saveRentalProduct() {
            const periods = []
            if (this.rentalData.priceDay) {
                periods.push({ period: 'DAY', price: parseFloat(this.rentalData.priceDay) })
            }
            if (this.rentalData.priceWeek) {
                periods.push({ period: 'WEEK', price: parseFloat(this.rentalData.priceWeek) })
            }
            if (this.rentalData.priceMonth) {
                periods.push({ period: 'MONTH', price: parseFloat(this.rentalData.priceMonth) })
            }

            await updateRentalProduct(this.product.id, {
                name: this.rentalData.name,
                description: this.rentalData.description,
                stock_qty: parseInt(this.rentalData.stock, 10),
                periods: periods,
                imageFile: this.rentalData.imageFile,
                is_active: this.rentalData.is_active
            })
        },

        cancel() {
            this.$router.push('/mis-productos')
        },

        isValidCombination(workTypeKey, toothGroupKey) {
            if (this.validCombinations.length === 0) return true

            const workType = this.workTypes.find(wt => {
                const name = wt.name.toLowerCase()
                if (workTypeKey === 'corona_total' && name.includes('corona')) return true
                if (workTypeKey === 'carilla' && name.includes('carilla')) return true
                if (workTypeKey === 'incrustacion' && name.includes('incrusta')) return true
                if (workTypeKey === 'puente' && name.includes('puente')) return true
                return false
            })

            const toothGroup = this.toothGroups.find(tg => {
                const name = tg.name.toLowerCase()
                if (toothGroupKey === 'anterior' && name.includes('anterior')) return true
                if (toothGroupKey === 'premolar' && name.includes('premolar')) return true
                if (toothGroupKey === 'molar' && name.includes('molar') && !name.includes('premolar')) return true
                return false
            })

            if (!workType || !toothGroup) return true

            return this.validCombinations.some(
                c => c.work_type_id === workType.id && c.tooth_group_id === toothGroup.id
            )
        },

        async loadCatalogs() {
            try {
                this.workTypes = await loadWorkTypes()
                this.toothGroups = await loadToothGroups()
                this.validCombinations = await loadValidWorkGroupCombinations()
            } catch (error) {
                console.error('Error loading catalogs:', error)
            }
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        this.loadProduct()
        this.loadCatalogs()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-20 pb-12">
        <div class="max-w-4xl mx-auto px-4">
            <div class="mb-6">
                <button @click="cancel" class="text-primary hover:text-primary-700 font-medium">
                    ← Volver a mis productos
                </button>
            </div>

            <div v-if="loading" class="text-center py-12">
                <p class="text-gray-600">Cargando producto...</p>
            </div>

            <div v-else-if="errorMessage && !product" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800">{{ errorMessage }}</p>
            </div>

            <!-- SUPPLY PRODUCT FORM -->
            <div v-else-if="productType === 'SUPPLY'" class="bg-white rounded-lg shadow-md p-6">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">Editar Producto</h1>

                <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-800">{{ errorMessage }}</p>
                </div>

                <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800">{{ successMessage }}</p>
                </div>

                <div class="space-y-6">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                        <input
                            v-model="supplyData.name"
                            type="text"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: Resina Compuesta"
                        />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                        <textarea
                            v-model="supplyData.description"
                            rows="4"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Describe el producto..."
                        ></textarea>
                    </div>

                    <!-- Image -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen</label>
                        <div v-if="supplyData.imagePreview" class="mb-3">
                            <img :src="supplyData.imagePreview" alt="Preview" class="w-48 h-48 object-cover rounded-lg" />
                        </div>
                        <input
                            type="file"
                            @change="handleImageChange"
                            accept="image/*"
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-700"
                        />
                    </div>

                    <!-- Price -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Precio *</label>
                        <input
                            v-model="supplyData.price"
                            type="number"
                            step="0.01"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                        />
                    </div>

                    <!-- Unit -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Unidad *</label>
                        <select
                            v-model="supplyData.unit"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="unidad">Unidad</option>
                            <option value="kg">Kilogramo</option>
                            <option value="g">Gramo</option>
                            <option value="l">Litro</option>
                            <option value="ml">Mililitro</option>
                            <option value="metro">Metro</option>
                            <option value="otro">Otro</option>
                        </select>
                        <input
                            v-if="supplyData.unit === 'otro'"
                            v-model="supplyData.unitCustom"
                            type="text"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                            placeholder="Especificá la unidad"
                        />
                    </div>

                    <!-- Stock -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
                        <input
                            v-model="supplyData.stock"
                            type="number"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0"
                        />
                    </div>

                    <!-- SKU -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">SKU (opcional)</label>
                        <input
                            v-model="supplyData.sku"
                            type="text"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Código del producto"
                        />
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center gap-3">
                        <input
                            v-model="supplyData.is_active"
                            type="checkbox"
                            id="supply_is_active"
                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <label for="supply_is_active" class="text-sm font-medium text-gray-700">
                            Producto activo (visible para compradores)
                        </label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-4 pt-6">
                        <button
                            @click="saveChanges"
                            :disabled="!canSave || saving"
                            class="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                        </button>
                        <button
                            @click="cancel"
                            :disabled="saving"
                            class="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            <!-- PROSTHESIS PRODUCT FORM -->
            <div v-else-if="productType === 'PROSTHESIS'" class="bg-white rounded-lg shadow-md p-6">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">Editar Prótesis</h1>

                <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-800">{{ errorMessage }}</p>
                </div>

                <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800">{{ successMessage }}</p>
                </div>

                <div class="space-y-6">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                        <input
                            v-model="prosthesisData.name"
                            type="text"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: Corona de Zirconio"
                        />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                        <textarea
                            v-model="prosthesisData.description"
                            rows="4"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Describe la prótesis, material, características..."
                        ></textarea>
                    </div>

                    <!-- Material -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Material *</label>
                        <select
                            v-model="prosthesisData.material"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Seleccionar material</option>
                            <option v-for="mat in materials" :key="mat.id" :value="mat.id">{{ mat.name }}</option>
                        </select>
                    </div>

                    <!-- Image -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen</label>
                        <div v-if="prosthesisData.imagePreview" class="mb-3">
                            <img :src="prosthesisData.imagePreview" alt="Preview" class="w-48 h-48 object-cover rounded-lg" />
                        </div>
                        <input
                            type="file"
                            @change="handleImageChange"
                            accept="image/*"
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-700"
                        />
                    </div>

                    <!-- Pricing Matrix -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Matriz de Precios *</h3>
                        <p class="text-sm text-gray-600 mb-4">Ingresá el precio para cada tipo de trabajo y grupo de diente</p>

                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="border border-gray-300 px-4 py-2 text-left">Tipo de Trabajo</th>
                                        <th class="border border-gray-300 px-4 py-2">Anterior</th>
                                        <th class="border border-gray-300 px-4 py-2">Premolar</th>
                                        <th class="border border-gray-300 px-4 py-2">Molar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(label, workType) in workTypeLabels" :key="workType">
                                        <td class="border border-gray-300 px-4 py-2 font-medium">{{ label }}</td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input
                                                v-model="prosthesisData.pricingMatrix[workType].anterior"
                                                type="number"
                                                step="0.01"
                                                :disabled="!isValidCombination(workType, 'anterior')"
                                                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                placeholder="Precio"
                                            />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input
                                                v-model="prosthesisData.pricingMatrix[workType].premolar"
                                                type="number"
                                                step="0.01"
                                                :disabled="!isValidCombination(workType, 'premolar')"
                                                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                placeholder="Precio"
                                            />
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2">
                                            <input
                                                v-model="prosthesisData.pricingMatrix[workType].molar"
                                                type="number"
                                                step="0.01"
                                                :disabled="!isValidCombination(workType, 'molar')"
                                                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                placeholder="Precio"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Manufacturing Days -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Días de fabricación</label>
                        <input
                            v-model="prosthesisData.deliveryTime"
                            type="number"
                            min="1"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: 5"
                        />
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center gap-3">
                        <input
                            v-model="prosthesisData.is_active"
                            type="checkbox"
                            id="prosthesis_is_active"
                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <label for="prosthesis_is_active" class="text-sm font-medium text-gray-700">
                            Producto activo (visible para compradores)
                        </label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-4 pt-6">
                        <button
                            @click="saveChanges"
                            :disabled="!canSave || saving"
                            class="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                        </button>
                        <button
                            @click="cancel"
                            :disabled="saving"
                            class="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            <!-- PLASTER_SERVICE PRODUCT FORM -->
            <div v-else-if="productType === 'PLASTER_SERVICE'" class="bg-white rounded-lg shadow-md p-6">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">Editar Servicio de Enyesado</h1>

                <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-800">{{ errorMessage }}</p>
                </div>

                <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800">{{ successMessage }}</p>
                </div>

                <div class="space-y-6">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                        <input
                            v-model="plasterData.name"
                            type="text"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: Modelo de estudio"
                        />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                        <textarea
                            v-model="plasterData.description"
                            rows="4"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Describe el servicio de enyesado..."
                        ></textarea>
                    </div>

                    <!-- Image -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen</label>
                        <div v-if="plasterData.imagePreview" class="mb-3">
                            <img :src="plasterData.imagePreview" alt="Preview" class="w-48 h-48 object-cover rounded-lg" />
                        </div>
                        <input
                            type="file"
                            @change="handleImageChange"
                            accept="image/*"
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-700"
                        />
                    </div>

                    <!-- Base Price -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Precio base *</label>
                        <input
                            v-model="plasterData.basePrice"
                            type="number"
                            step="0.01"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                        />
                    </div>

                    <!-- Manufacturing Days -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Días de fabricación</label>
                        <input
                            v-model="plasterData.deliveryTime"
                            type="number"
                            min="1"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: 3"
                        />
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center gap-3">
                        <input
                            v-model="plasterData.is_active"
                            type="checkbox"
                            id="plaster_is_active"
                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <label for="plaster_is_active" class="text-sm font-medium text-gray-700">
                            Producto activo (visible para compradores)
                        </label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-4 pt-6">
                        <button
                            @click="saveChanges"
                            :disabled="!canSave || saving"
                            class="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                        </button>
                        <button
                            @click="cancel"
                            :disabled="saving"
                            class="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            <!-- RENTAL PRODUCT FORM -->
            <div v-else-if="productType === 'RENTAL'" class="bg-white rounded-lg shadow-md p-6">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">Editar Alquiler</h1>

                <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-800">{{ errorMessage }}</p>
                </div>

                <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800">{{ successMessage }}</p>
                </div>

                <div class="space-y-6">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                        <input
                            v-model="rentalData.name"
                            type="text"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: Equipo de rayos X"
                        />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                        <textarea
                            v-model="rentalData.description"
                            rows="4"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Describe el equipo o item en alquiler..."
                        ></textarea>
                    </div>

                    <!-- Image -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Imagen</label>
                        <div v-if="rentalData.imagePreview" class="mb-3">
                            <img :src="rentalData.imagePreview" alt="Preview" class="w-48 h-48 object-cover rounded-lg" />
                        </div>
                        <input
                            type="file"
                            @change="handleImageChange"
                            accept="image/*"
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-700"
                        />
                    </div>

                    <!-- Stock -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Cantidad disponible *</label>
                        <input
                            v-model="rentalData.stock"
                            type="number"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0"
                        />
                    </div>

                    <!-- Pricing -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Precios de alquiler</h3>
                        <p class="text-sm text-gray-600 mb-4">Ingresá al menos un precio</p>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Precio por día</label>
                                <input
                                    v-model="rentalData.priceDay"
                                    type="number"
                                    step="0.01"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Precio por semana</label>
                                <input
                                    v-model="rentalData.priceWeek"
                                    type="number"
                                    step="0.01"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Precio por mes</label>
                                <input
                                    v-model="rentalData.priceMonth"
                                    type="number"
                                    step="0.01"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center gap-3">
                        <input
                            v-model="rentalData.is_active"
                            type="checkbox"
                            id="rental_is_active"
                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <label for="rental_is_active" class="text-sm font-medium text-gray-700">
                            Producto activo (visible para compradores)
                        </label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-4 pt-6">
                        <button
                            @click="saveChanges"
                            :disabled="!canSave || saving"
                            class="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                        </button>
                        <button
                            @click="cancel"
                            :disabled="saving"
                            class="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
