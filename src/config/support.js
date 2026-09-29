/**
 * Datos de contacto de soporte, en un solo lugar.
 * Para desvincular el WhatsApp de prueba alcanza con dejar `whatsappNumber` vacío:
 * el globo flotante y la opción de WhatsApp en /soporte se ocultan solos.
 */
export const SUPPORT = {
    whatsappNumber: '34670440709',
    whatsappMessage: 'Hola, me contacto porque estoy necesitando ayuda con ProviDent.',
    email: 'soporte@provident.com',
    hours: 'Lunes a viernes de 9 a 18 hs'
}

export function whatsappUrl() {
    if (!SUPPORT.whatsappNumber) return null
    return `https://wa.me/${SUPPORT.whatsappNumber}?text=${encodeURIComponent(SUPPORT.whatsappMessage)}`
}
