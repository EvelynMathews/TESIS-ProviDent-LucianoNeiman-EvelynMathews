/**
 * Datos y validaciones compartidos por los formularios de publicación.
 * Los usan Publicar (crear) y Editar producto, así las dos páginas piden lo mismo.
 */

export const SUPPLY_UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'caja', label: 'Caja' },
  { value: 'kilo', label: 'Kilo' },
  { value: 'litro', label: 'Litro' },
  { value: 'metro', label: 'Metro' },
  { value: 'pack', label: 'Pack' }
]

export const WORK_TYPES = {
  corona_total: 'Corona total',
  carilla: 'Carilla',
  incrustacion: 'Incrustación',
  puente: 'Puente'
}

export const TOOTH_GROUPS = {
  anterior: 'Anterior',
  premolar: 'Premolar',
  molar: 'Molar'
}

export function emptyPricingMatrix() {
  const matrix = {}
  for (const workType of Object.keys(WORK_TYPES)) {
    matrix[workType] = { anterior: '', premolar: '', molar: '' }
  }
  return matrix
}

const base = () => ({ name: '', description: '', imageFile: null, imagePreview: null, is_active: true })

export const emptyForms = {
  supply: () => ({ ...base(), price: '', unit: 'unidad', unitCustom: '', stock: '', sku: '', shippingMethodId: null }),
  prosthesis: () => ({ ...base(), material: '', materialName: '', pricingMatrix: emptyPricingMatrix(), deliveryTime: '' }),
  plaster: () => ({ ...base(), basePrice: '', deliveryTime: '' }),
  rental: () => ({ ...base(), stock: '', priceDay: '', priceWeek: '', priceMonth: '' })
}

export function hasMatrixPrice(matrix) {
  return Object.values(matrix).some(row => Object.values(row).some(price => price && Number(price) > 0))
}

const filled = value => String(value ?? '').trim() !== ''

/**
 * Devuelve la lista de campos que faltan completar, con nombres para mostrarle al usuario.
 * `requireImage` es true al publicar; al editar la publicación ya tiene imagen.
 */
export function missingFields(type, form, { requireImage = false } = {}) {
  const missing = []
  const need = (ok, label) => { if (!ok) missing.push(label) }

  need(filled(form.name), 'nombre')
  need(filled(form.description), 'descripción')
  if (requireImage) need(form.imageFile, 'una imagen')

  if (type === 'supply') {
    need(form.price, 'precio')
    need(form.stock, 'stock')
    need(form.unit !== 'otro' || filled(form.unitCustom), 'unidad de medida')
  } else if (type === 'prosthesis') {
    need(filled(form.material), 'material')
    need(hasMatrixPrice(form.pricingMatrix), 'al menos un precio en la matriz')
  } else if (type === 'plaster') {
    need(form.basePrice, 'precio base')
  } else if (type === 'rental') {
    need(form.stock, 'unidades disponibles')
    need(form.priceDay || form.priceWeek || form.priceMonth, 'al menos un precio')
  }
  return missing
}

export function supplyUnitLabel(form) {
  return form.unit === 'otro' ? form.unitCustom.trim() : form.unit
}

export function setImage(form, file) {
  form.imageFile = file
  form.imagePreview = URL.createObjectURL(file)
}

export function clearImage(form) {
  form.imageFile = null
  form.imagePreview = null
}
