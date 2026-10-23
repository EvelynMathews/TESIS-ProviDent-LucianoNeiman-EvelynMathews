/**
 * Tipos de publicación reales del marketplace (coinciden con `products.product_type`).
 * Se usan como categorías en la home y como filtros del catálogo, así cada
 * categoría lleva a resultados reales.
 */
export const catalogTypes = [
  {
    id: 'SUPPLY',
    slug: 'insumos',
    name: 'Insumos y materiales',
    icon: 'supply',
    description: 'Materiales, instrumental y equipamiento para el consultorio'
  },
  {
    id: 'PROSTHESIS',
    slug: 'protesis',
    name: 'Prótesis',
    icon: 'prosthesis',
    description: 'Coronas, carillas, puentes e incrustaciones por encargo'
  },
  {
    id: 'PLASTER_SERVICE',
    slug: 'yeso',
    name: 'Modelado en yeso',
    icon: 'plaster',
    description: 'Vaciado y modelos de trabajo hechos por laboratorios'
  },
  {
    id: 'RENTAL',
    slug: 'alquiler',
    name: 'Alquiler de equipos',
    icon: 'rental',
    description: 'Equipos por día, semana o mes'
  }
]

export const SERVICE_TYPES = ['PROSTHESIS', 'PLASTER_SERVICE', 'RENTAL']
