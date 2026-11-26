/**
 * Formato de precios y fechas para mostrar en pantalla (es-AR).
 * Todas las páginas y componentes usan estas funciones, así se ven igual en toda la app.
 */

const numberFormat = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

// 4500 -> "4.500" (sin signo, para usar como ${{ formatPrice(x) }})
export function formatPrice(value) {
  return numberFormat.format(Number(value) || 0)
}

// 4500 -> "$4.500"
export function formatMoney(value) {
  return '$' + formatPrice(value)
}

// A date without time ("2026-11-30") is read as local time so it doesn't show the previous day
function toDate(value) {
  if (!value) return null
  const isDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  const d = new Date(isDateOnly ? `${value}T00:00:00` : value)
  return isNaN(d) ? null : d
}

// "30 nov 2026" (con hora si withTime es true)
export function formatDate(value, withTime = false) {
  const d = toDate(value)
  if (!d) return ''
  const options = { day: 'numeric', month: 'short', year: 'numeric' }
  if (withTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-AR', options)
}

// "30 de noviembre de 2026" (con hora si withTime es true)
export function formatLongDate(value, withTime = false) {
  const d = toDate(value)
  if (!d) return ''
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  if (withTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-AR', options)
}
