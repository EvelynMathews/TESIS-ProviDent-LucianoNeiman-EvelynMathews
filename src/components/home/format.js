export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
}
