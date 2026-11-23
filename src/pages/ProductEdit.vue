<script>
/**
 * Propósito: Vista para que un vendedor edite una publicación existente.
 * Función: Muestra el formulario del tipo de producto (`SUPPLY`, `PROSTHESIS`, `PLASTER_SERVICE`, `RENTAL`)
 * precargado con los datos actuales. Los formularios son los mismos componentes que usa Publicar.
 * Cómo funciona: `loadProduct` trae la publicación y `fillForm` pasa sus datos al formato del formulario.
 * `saveChanges` llama a la función `update...Product` que corresponde al tipo.
 */
import {
    getProductById,
    updateSupplyProduct,
    updateProsthesisProduct,
    updatePlasterServiceProduct,
    updateRentalProduct,
    loadWorkTypes,
    loadToothGroups
} from '../services/products'
import { emptyForms, missingFields, supplyUnitLabel, SUPPLY_UNITS } from '../components/product-forms/listing-form'
import SupplyForm from '../components/product-forms/SupplyForm.vue'
import ProsthesisForm from '../components/product-forms/ProsthesisForm.vue'
import PlasterForm from '../components/product-forms/PlasterForm.vue'
import RentalForm from '../components/product-forms/RentalForm.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const FORM_TYPES = { SUPPLY: 'supply', PROSTHESIS: 'prosthesis', PLASTER_SERVICE: 'plaster', RENTAL: 'rental' }

const TITLES = {
    supply: 'Editar producto',
    prosthesis: 'Editar prótesis',
    plaster: 'Editar modelado en yeso',
    rental: 'Editar alquiler'
}

export default {
    name: 'ProductEdit',
    components: { SupplyForm, ProsthesisForm, PlasterForm, RentalForm, LoadingSpinner },
    data() {
        return {
            product: null,
            formType: null,
            form: null,
            loading: true,
            saving: false,
            errorMessage: null,
            successMessage: null
        }
    },
    computed: {
        title() {
            return TITLES[this.formType]
        },
        missing() {
            return this.form ? missingFields(this.formType, this.form) : []
        },
        canSave() {
            return this.missing.length === 0
        }
    },
    methods: {
        async loadProduct() {
            try {
                this.loading = true
                const product = await getProductById(this.$route.params.id)
                if (!product) {
                    this.errorMessage = 'No encontramos esta publicación. Puede que se haya eliminado.'
                    return
                }
                this.product = product
                this.formType = FORM_TYPES[product.product_type]
                const form = emptyForms[this.formType]()
                await this.fillForm(form, product)
                this.form = form
            } catch (e) {
                console.error('Error loading product:', e)
                this.errorMessage = 'Error al cargar el producto'
            } finally {
                this.loading = false
            }
        },

        async fillForm(form, product) {
            form.name = product.name || ''
            form.description = product.description || ''
            form.imagePreview = product.image || null
            form.is_active = product.is_active !== false

            if (this.formType === 'supply') {
                form.price = product.price
                form.stock = product.stock
                form.sku = product.sku || ''
                if (SUPPLY_UNITS.some(u => u.value === product.unit)) {
                    form.unit = product.unit
                } else {
                    form.unit = 'otro'
                    form.unitCustom = product.unit || ''
                }
            } else if (this.formType === 'prosthesis') {
                form.material = product.material_id || ''
                form.deliveryTime = product.manufacturing_days || ''
                await this.fillPricingMatrix(form.pricingMatrix, product.pricing_matrix || [])
            } else if (this.formType === 'plaster') {
                form.basePrice = product.price || product.base_price
                form.deliveryTime = product.manufacturing_days || ''
            } else if (this.formType === 'rental') {
                form.stock = product.stock_qty ?? product.stock ?? ''
                for (const rp of product.rental_pricing || []) {
                    // La base guarda los períodos como '1 day' / '7 days' / '30 days'
                    if (rp.period === '1 day' || rp.period === 'DAY') form.priceDay = rp.price
                    if (rp.period === '7 days' || rp.period === 'WEEK') form.priceWeek = rp.price
                    if (rp.period === '30 days' || rp.period === 'MONTH') form.priceMonth = rp.price
                }
            }
        },

        async fillPricingMatrix(matrix, prices) {
            if (!prices.length) return
            const [workTypes, toothGroups] = await Promise.all([loadWorkTypes(), loadToothGroups()])

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
                else if (name.includes('molar')) groupIdToKey[tg.id] = 'molar'
            })

            prices.forEach(price => {
                const row = matrix[workTypeIdToKey[price.work_type_id]]
                const group = groupIdToKey[price.tooth_group_id]
                if (row && group) row[group] = price.unit_price
            })
        },

        updateListing(id, type, f) {
            if (type === 'supply') {
                return updateSupplyProduct(id, {
                    name: f.name,
                    description: f.description,
                    unit_price: parseFloat(f.price),
                    unit_label: supplyUnitLabel(f),
                    stock_qty: parseInt(f.stock, 10),
                    sku: f.sku || null,
                    imageFile: f.imageFile,
                    is_active: f.is_active
                })
            }
            if (type === 'prosthesis') {
                return updateProsthesisProduct(id, {
                    name: f.name,
                    description: f.description,
                    materialId: f.material || null,
                    pricingMatrix: f.pricingMatrix,
                    deliveryTime: f.deliveryTime,
                    imageFile: f.imageFile,
                    is_active: f.is_active
                })
            }
            if (type === 'plaster') {
                return updatePlasterServiceProduct(id, {
                    name: f.name,
                    description: f.description,
                    base_price: parseFloat(f.basePrice),
                    deliveryTime: f.deliveryTime,
                    imageFile: f.imageFile,
                    is_active: f.is_active
                })
            }
            return updateRentalProduct(id, {
                name: f.name,
                description: f.description,
                stock_qty: parseInt(f.stock, 10),
                priceDay: f.priceDay || null,
                priceWeek: f.priceWeek || null,
                priceMonth: f.priceMonth || null,
                imageFile: f.imageFile,
                is_active: f.is_active
            })
        },

        async saveChanges() {
            if (!this.canSave) {
                this.errorMessage = `Completá: ${this.missing.join(', ')}.`
                return
            }
            try {
                this.saving = true
                this.errorMessage = null
                await this.updateListing(this.product.id, this.formType, this.form)
                this.successMessage = 'Cambios guardados. Volviendo a tus publicaciones…'
                setTimeout(() => {
                    this.$router.push('/mis-productos')
                }, 1500)
            } catch (e) {
                console.error('Error saving:', e)
                this.errorMessage = 'No pudimos guardar los cambios. Revisá los datos e intentá de nuevo.'
            } finally {
                this.saving = false
            }
        },

        showError(message) {
            this.errorMessage = message
        },

        cancel() {
            this.$router.push('/mis-productos')
        }
    },
    mounted() {
        this.loadProduct()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-8 pb-16">
        <div class="max-w-4xl mx-auto px-4">
            <div class="mb-6">
                <button type="button" @click="cancel" class="text-primary hover:text-primary-700 font-medium">
                    ← Mis publicaciones
                </button>
            </div>

            <LoadingSpinner v-if="loading" message="Cargando producto..." />

            <div v-else-if="!form" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800">{{ errorMessage }}</p>
            </div>

            <div v-else class="bg-white rounded-lg shadow-md p-5 sm:p-8">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-6">{{ title }}</h1>

                <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                    <p class="text-red-800">{{ errorMessage }}</p>
                </div>

                <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4" role="status">
                    <p class="text-green-800">{{ successMessage }}</p>
                </div>

                <SupplyForm v-if="formType === 'supply'" :form="form" @invalid="showError" />
                <ProsthesisForm v-else-if="formType === 'prosthesis'" :form="form" @invalid="showError" />
                <PlasterForm v-else-if="formType === 'plaster'" :form="form" @invalid="showError" />
                <RentalForm v-else-if="formType === 'rental'" :form="form" @invalid="showError" />

                <div class="flex items-center gap-3 mt-6">
                    <input id="edit-is-active" v-model="form.is_active" type="checkbox"
                        class="w-4 h-4 accent-primary border-gray-300 rounded" />
                    <label for="edit-is-active" class="text-sm font-medium text-gray-700">
                        Producto activo (visible para compradores)
                    </label>
                </div>

                <p v-if="missing.length" class="mt-6 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" role="status">
                    Para guardar completá: <strong>{{ missing.join(', ') }}</strong>.
                </p>

                <div class="flex gap-3 pt-6">
                    <button type="button" @click="saveChanges" :disabled="!canSave || saving"
                        class="flex-1 sm:flex-none h-12 px-6 bg-primary text-white font-semibold rounded-lg whitespace-nowrap hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                    </button>
                    <button type="button" @click="cancel" :disabled="saving"
                        class="h-12 px-6 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
