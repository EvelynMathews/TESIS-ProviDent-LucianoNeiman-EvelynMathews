export function formatPrice(price) {
  return new Intl.NumberFormat('es-AR').format(price)
}
