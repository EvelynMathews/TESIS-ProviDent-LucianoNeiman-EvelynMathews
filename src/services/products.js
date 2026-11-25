/**
 * Punto de entrada de los servicios de productos. Cada tema vive en su archivo;
 * acá se re-exporta todo para que las páginas sigan importando desde `products.js`.
 * Los métodos de envío del vendedor están en `shipping.js`.
 */

export * from './catalog'
export * from './product-publish'
export * from './product-edit'
export * from './prosthesis-pricing'
export { getProductThumbnails } from './product-images'
