<script>
import { subscribeToAuthStateChanges } from '../services/auth'
import { getProductById, listActiveProducts, loadMaterials, loadWorkTypes, loadToothGroups, loadTeeth, loadValidWorkGroupCombinations } from '../services/products'
import ProductCard from '../components/ProductCard.vue'

export default {
    name: 'ProductDetail',
    components: {
        ProductCard
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
            },
            product: null,
            quantity: 1,
            loading: false,
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
            selectedCombinations: [] // [{toothId, workTypeId, price}]
        }
    },
    computed: {
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
            }
            return 0
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
        addToCart() {
            if (this.product.product_type === 'SUPPLY') {
                alert(`Agregado al carrito: ${this.quantity} ${this.product.unit} de ${this.product.name}`)
            } else if (this.product.product_type === 'PROSTHESIS') {
                if (this.isMatrixMode) {
                    // Matrix mode: show all combinations
                    const combinations = this.selectedCombinations.map(combo => {
                        const tooth = this.teeth.find(t => t.id === combo.toothId)
                        const workType = this.workTypes.find(wt => wt.id === combo.workTypeId)
                        return `${tooth?.fdi_code} (${workType?.name}): $${this.formatPrice(combo.price)}`
                    }).join('\n')
                    alert(`Solicitud de prótesis: ${this.product.name}\n\nCombinaciones:\n${combinations}\n\nTotal: $${this.formatPrice(this.totalPrice)}`)
                } else {
                    // Default mode: single work type
                    const workType = this.workTypes.find(wt => wt.id === this.selectedWorkType)
                    const selectedTeeth = this.availableTeethForWorkType
                        .filter(t => this.selectedTeethIds.includes(t.tooth.id))
                        .map(t => t.tooth.fdi_code)
                        .join(', ')
                    alert(`Solicitud de prótesis: ${this.product.name}\nTipo: ${workType?.name}\nDientes: ${selectedTeeth}\nTotal: $${this.formatPrice(this.totalPrice)}`)
                }
            } else if (this.product.product_type === 'PLASTER_SERVICE') {
                alert(`Solicitud de servicio: ${this.product.name}\nPrecio: $${this.formatPrice(this.product.base_price)}`)
            }
        },
        async loadRelatedProducts() {
            try {
                const items = await listActiveProducts()
                const currentId = this.product?.id
                this.relatedProducts = items.filter(p => p.id !== currentId).slice(0, 4)
            } catch (e) { console.error(e) }
        },
        async loadProduct() {
            try {
                this.loading = true
                const id = this.$route.params.id
                const p = await getProductById(id)
                this.product = p

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
                console.error('Failed to load product', e)
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
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
        this.loadProduct()
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pt-20 pb-12">
        <div class="max-w-7xl mx-auto px-4">
            <div class="mb-6">
                <RouterLink to="/productos" class="text-primary hover:text-primary-700 font-medium">
                    ← Volver a productos
                </RouterLink>
            </div>

            <div v-if="product" class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                    <div>
                        <img :src="product.image" :alt="product.name" class="w-full rounded-lg shadow-lg" />
                    </div>

                    <div>
                        <div class="mb-4">
                            <span class="text-sm text-secondary font-semibold uppercase">{{ product.category }}</span>
                            <p v-if="product.brand" class="text-gray-500 text-sm mt-1">{{ product.brand }}</p>
                        </div>

                        <h1 class="font-heading text-3xl font-bold text-gray-800 mb-4">{{ product.name }}</h1>

                        <div class="flex items-center gap-3 mb-6">
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
                            <p class="text-4xl font-bold text-secondary mb-2">${{ formatPrice(product.price) }}</p>
                            <p class="text-sm text-gray-600">{{ product.unit || 'unidad' }}</p>
                        </div>

                        <!-- Price section for PLASTER_SERVICE products -->
                        <div v-if="product.product_type === 'PLASTER_SERVICE'" class="mb-6">
                            <p class="text-4xl font-bold text-secondary mb-2">${{ formatPrice(product.base_price) }}</p>
                            <p class="text-sm text-gray-600">Precio base</p>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-2">Descripción</h3>
                            <p class="text-gray-600 leading-relaxed">{{ product.description }}</p>
                        </div>

                        <!-- Configuration section for PROSTHESIS products - Variant A (Default) -->
                        <div v-if="product.product_type === 'PROSTHESIS' && uiMode === 'default'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Configurar prótesis</h3>

                            <div class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de trabajo:</label>
                                <select v-model="selectedWorkType"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
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
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Seleccionar piezas dentales:</label>
                                <div v-if="!selectedWorkType" class="text-sm text-gray-500 italic">
                                    Primero seleccioná un tipo de trabajo
                                </div>
                                <div v-else-if="availableTeethForWorkType.length === 0" class="text-sm text-gray-500 italic">
                                    No hay piezas disponibles para este tipo de trabajo
                                </div>
                                <div v-else class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                    <div v-for="item in availableTeethForWorkType" :key="item.tooth.id"
                                         class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                                        <input
                                            type="checkbox"
                                            :id="`tooth-${item.tooth.id}`"
                                            :value="item.tooth.id"
                                            v-model="selectedTeethIds"
                                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
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
                                <p class="text-xs text-gray-500">{{ selectedTeethIds.length }} pieza(s) seleccionada(s)</p>
                            </div>
                        </div>

                        <!-- Configuration section for PROSTHESIS products - Variant B (Matrix) -->
                        <div v-if="product.product_type === 'PROSTHESIS' && uiMode === 'matrix'" class="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Configurar prótesis - Vista Matriz</h3>

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
                                                        :checked="isCombinationSelected(tooth.id, wt.id)"
                                                        @change="toggleCombination(tooth.id, wt.id)"
                                                        class="w-4 h-4 text-primary border-gray-300 rounded cursor-pointer"
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
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Configurar prótesis - Vista por Cuadrante</h3>

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
                                                            :checked="isCombinationSelected(tooth.id, wt.id)"
                                                            @change="toggleCombination(tooth.id, wt.id)"
                                                            class="w-4 h-4 text-primary border-gray-300 rounded cursor-pointer"
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
                            <p class="text-sm text-green-600 mb-3">
                                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                                Stock disponible: {{ product.stock }} unidades
                            </p>

                            <div class="flex items-center gap-4 mb-6">
                                <label class="font-semibold text-gray-700">Cantidad:</label>
                                <div class="flex items-center border border-gray-300 rounded-lg">
                                    <button @click="decreaseQuantity"
                                        class="px-4 py-2 hover:bg-gray-100 transition"
                                        :disabled="quantity <= 1">
                                        -
                                    </button>
                                    <span class="px-6 py-2 border-x border-gray-300 font-semibold">{{ quantity }}</span>
                                    <button @click="increaseQuantity"
                                        class="px-4 py-2 hover:bg-gray-100 transition"
                                        :disabled="quantity >= product.stock">
                                        +
                                    </button>
                                </div>
                            </div>

                            <div class="mb-6">
                                <p class="text-lg text-gray-700">
                                    Total: <span class="font-bold text-2xl text-primary">${{ formatPrice(totalPrice) }}</span>
                                </p>
                            </div>

                            <button @click="addToCart"
                                class="w-full text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:opacity-90"
                                style="background-color: #2A6FAF;">
                                Agregar al carrito
                            </button>
                        </div>

                        <!-- Out of stock message for SUPPLY products only -->
                        <div v-if="product.product_type === 'SUPPLY' && (!product.stock || product.stock === 0)" class="mb-6">
                            <p class="text-red-600 font-extrabold tracking-wide">SIN STOCK</p>
                        </div>

                        <!-- Action button for PROSTHESIS -->
                        <button v-if="product.product_type === 'PROSTHESIS'" @click="addToCart"
                            :disabled="isMatrixMode ? selectedCombinations.length === 0 : selectedTeethIds.length === 0"
                            class="w-full text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                            style="background-color: #2A6FAF;">
                            Solicitar prótesis
                        </button>

                        <!-- Action button for PLASTER_SERVICE -->
                        <button v-if="product.product_type === 'PLASTER_SERVICE'" @click="addToCart"
                            class="w-full text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:opacity-90 mb-6"
                            style="background-color: #2A6FAF;">
                            Solicitar servicio
                        </button>

                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="font-heading font-semibold text-gray-800 mb-3">Vendido por</h3>
                            <div class="flex items-center gap-3">
                                <img v-if="product.seller?.avatar_url" :src="product.seller.avatar_url" alt="avatar"
                                     class="w-12 h-12 rounded-full object-cover" />
                                <div v-else class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700">
                                    {{ initials(product.seller?.username) }}
                                </div>
                                <div>
                                    <RouterLink :to="`/usuario/${product.seller?.id}`" class="font-semibold text-gray-800 hover:underline">
                                        {{ product.seller.username }}
                                    </RouterLink>
                                    <p v-if="product.seller.location" class="text-sm text-gray-600">{{ product.seller.location }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="relatedProducts.length > 0" class="mt-12">
                <h2 class="font-heading text-2xl font-bold text-gray-800 mb-6">Productos relacionados</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ProductCard
                        v-for="relatedProduct in relatedProducts"
                        :key="relatedProduct.id"
                        :product="relatedProduct"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
