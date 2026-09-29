/**
 * Lógica de la vista de edición de un producto desde el Panel de Administración.
 * Propósito: Permitir que un administrador corrija los datos de cualquier publicación,
 * sin importar qué vendedor la creó.
 * Funcionamiento: `loadProduct` trae el producto con `getProductById` y carga el formulario;
 * los datos faltantes quedan como campos vacíos. `saveProduct` usa la función de
 * actualización del tipo de producto (las mismas que usa el vendedor) y vuelve a leer
 * el producto de la base para mostrar lo que realmente quedó guardado.
 * Los permisos los controla la base con las políticas RLS de admin (`is_admin`).
 */

import {
    getProductById,
    updateSupplyProduct,
    updateProsthesisProduct,
    updatePlasterServiceProduct,
    updateRentalProduct,
    loadMaterials,
    pricingMatrixFromRows
} from '../../services/products'
import AdminLayout from '../../components/admin/AdminLayout.vue'

const RENTAL_PERIODS = { '1 day': 'priceDay', '7 days': 'priceWeek', '30 days': 'priceMonth' }

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value)

export default {
    name: 'AdminProductEdit',
    components: {
        AdminLayout
    },
    data() {
        return {
            product: null,
            form: null,
            materials: [],
            imageFile: null,
            imagePreview: null,
            loading: true,
            saving: false,
            loadError: '',
            saveError: '',
            saveSuccess: false,
            workTypeLabels: {
                corona_total: 'Corona total',
                carilla: 'Carilla',
                incrustacion: 'Incrustación',
                puente: 'Puente'
            },
            groupLabels: {
                anterior: 'Anterior',
                premolar: 'Premolar',
                molar: 'Molar'
            }
        }
    },
    computed: {
        typeName() {
            const types = {
                SUPPLY: 'Insumo',
                PROSTHESIS: 'Prótesis',
                PLASTER_SERVICE: 'Servicio de Yeso',
                RENTAL: 'Alquiler'
            }
            return types[this.product?.product_type] || this.product?.product_type
        }
    },
    methods: {
        async loadProduct() {
            this.loadError = ''
            try {
                const product = await getProductById(this.$route.params.id)
                if (!product) {
                    this.loadError = 'No encontramos este producto. Puede que haya sido eliminado.'
                    return
                }

                const rentalPrices = { priceDay: '', priceWeek: '', priceMonth: '' }
                ;(product.rental_pricing || []).forEach(rp => {
                    const key = RENTAL_PERIODS[rp.period]
                    if (key) rentalPrices[key] = rp.price
                })

                this.product = product
                this.imagePreview = product.image
                this.imageFile = null
                this.form = {
                    name: product.name || '',
                    description: product.description || '',
                    is_active: product.is_active !== false,
                    price: product.price ?? '',
                    unit: product.unit ?? '',
                    stock: product.stock ?? product.stock_qty ?? '',
                    sku: product.sku ?? '',
                    material_id: product.material_id ?? '',
                    manufacturing_days: product.manufacturing_days ?? '',
                    base_price: product.base_price ?? '',
                    pricingMatrix: product.product_type === 'PROSTHESIS'
                        ? await pricingMatrixFromRows(product.pricing_matrix)
                        : null,
                    ...rentalPrices
                }

                if (product.product_type === 'PROSTHESIS') {
                    this.materials = await loadMaterials()
                }
            } catch (error) {
                console.error('Error al cargar el producto:', error)
                this.loadError = 'No se pudo cargar el producto. Intentá de nuevo más tarde.'
            } finally {
                this.loading = false
            }
        },
        handleImageChange(event) {
            const file = event.target.files[0]
            if (!file) return
            this.imageFile = file
            this.imagePreview = URL.createObjectURL(file)
        },
        async saveProduct() {
            this.saveError = ''
            this.saveSuccess = false
            this.saving = true

            const f = this.form
            const common = {
                name: f.name.trim(),
                description: f.description.trim(),
                is_active: f.is_active,
                imageFile: this.imageFile || undefined
            }

            try {
                const id = this.product.id
                const type = this.product.product_type

                if (type === 'SUPPLY') {
                    await updateSupplyProduct(id, {
                        ...common,
                        unit_price: emptyToUndefined(f.price),
                        unit_label: emptyToUndefined(String(f.unit).trim()),
                        stock_qty: emptyToUndefined(f.stock),
                        sku: f.sku.trim() || null
                    })
                } else if (type === 'PROSTHESIS') {
                    await updateProsthesisProduct(id, {
                        ...common,
                        materialId: f.material_id || null,
                        deliveryTime: f.manufacturing_days,
                        pricingMatrix: f.pricingMatrix
                    })
                } else if (type === 'PLASTER_SERVICE') {
                    await updatePlasterServiceProduct(id, {
                        ...common,
                        base_price: emptyToUndefined(f.base_price),
                        deliveryTime: f.manufacturing_days
                    })
                } else if (type === 'RENTAL') {
                    await updateRentalProduct(id, {
                        ...common,
                        stock_qty: emptyToUndefined(f.stock),
                        priceDay: f.priceDay,
                        priceWeek: f.priceWeek,
                        priceMonth: f.priceMonth
                    })
                }

                await this.loadProduct()
                this.saveSuccess = true
            } catch (error) {
                console.error('Error al guardar el producto:', error)
                this.saveError = `No se pudieron guardar los cambios: ${error.message}`
            } finally {
                this.saving = false
            }
        }
    },
    mounted() {
        this.loadProduct()
    }
}
