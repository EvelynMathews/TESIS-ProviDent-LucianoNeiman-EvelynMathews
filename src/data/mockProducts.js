export const categories = [
  {
    id: 1,
    name: 'Materiales e Insumos',
    slug: 'materiales-insumos',
    icon: 'materials',
    description: 'Insumos odontológicos de calidad profesional'
  },
  {
    id: 2,
    name: 'Equipamiento',
    slug: 'equipamiento',
    icon: 'equipment',
    description: 'Equipos y herramientas para consultorios'
  },
  {
    id: 3,
    name: 'Prótesis y Laboratorio',
    slug: 'protesis-laboratorio',
    icon: 'prosthesis',
    description: 'Servicios protésicos y de laboratorio'
  },
  {
    id: 4,
    name: 'Servicios Técnicos',
    slug: 'servicios-tecnicos',
    icon: 'services',
    description: 'Servicios especializados para profesionales'
  }
]

export const products = [
  {
    id: 1,
    name: 'Resina Compuesta Flow A2',
    brand: 'DentFlow Pro',
    category_id: 1,
    category: 'Materiales e Insumos',
    price: 18500,
    stock: 45,
    unit: 'Jeringa 4g',
    description: 'Resina compuesta de microhíbrida de última generación. Ideal para restauraciones anteriores y posteriores. Excelente pulido y estética natural.',
    image: 'https://placehold.co/400x400/2A6FAF/ffffff?text=Resina+Flow',
    product_type: 'product',
    seller: {
      id: 101,
      username: 'Dental Supply BA',
      rating: 4.8,
      sales_count: 234
    }
  },
  {
    id: 2,
    name: 'Kit Brocas Diamantadas',
    brand: 'DiamondBur',
    category_id: 1,
    category: 'Materiales e Insumos',
    price: 32000,
    stock: 12,
    unit: 'Kit x 20 unidades',
    description: 'Set completo de brocas diamantadas para alta y baja velocidad. Incluye estuche autoclavable. Diversas formas y granos.',
    image: 'https://placehold.co/400x400/29A68C/ffffff?text=Brocas',
    product_type: 'product',
    seller: {
      id: 102,
      username: 'Instrumental Profesional',
      rating: 4.9,
      sales_count: 156
    }
  },
  {
    id: 3,
    name: 'Yeso Piedra Tipo IV',
    brand: 'GipsoDent',
    category_id: 1,
    category: 'Materiales e Insumos',
    price: 8900,
    stock: 78,
    unit: 'Bolsa 1kg',
    description: 'Yeso de alta resistencia para modelos de trabajo. Expansión controlada. Tiempo de fraguado: 10-12 minutos.',
    image: 'https://placehold.co/400x400/29A68C/ffffff?text=Yeso+Piedra',
    product_type: 'product',
    seller: {
      id: 103,
      username: 'Lab Suministros',
      rating: 4.7,
      sales_count: 89
    }
  },
  {
    id: 4,
    name: 'Micromotor Portátil LED',
    brand: 'TechDent Pro',
    category_id: 2,
    category: 'Equipamiento',
    price: 285000,
    stock: 5,
    unit: 'Unidad',
    description: 'Micromotor brushless de última generación. Incluye luz LED integrada, contraángulo y pieza de mano. 40,000 RPM. Batería de larga duración.',
    image: 'https://placehold.co/400x400/2A6FAF/ffffff?text=Micromotor',
    product_type: 'product',
    seller: {
      id: 104,
      username: 'Equipo Dental Argentina',
      rating: 5.0,
      sales_count: 67
    }
  },
  {
    id: 5,
    name: 'Autoclave Clase B 18L',
    brand: 'SterilMax',
    category_id: 2,
    category: 'Equipamiento',
    price: 1250000,
    stock: 2,
    unit: 'Unidad',
    description: 'Autoclave de última generación con pre-vacío. Capacidad 18 litros. 6 programas de esterilización. Cumple normativas europeas.',
    image: 'https://placehold.co/400x400/DC8C73/ffffff?text=Autoclave',
    product_type: 'product',
    seller: {
      id: 105,
      username: 'Esterilización Total',
      rating: 4.9,
      sales_count: 34
    }
  },
  {
    id: 6,
    name: 'Amalgamador Digital',
    brand: 'MixDent',
    category_id: 2,
    category: 'Equipamiento',
    price: 95000,
    stock: 8,
    unit: 'Unidad',
    description: 'Amalgamador de cápsulas con velocidad ajustable. Pantalla digital. Timer programable. Silencioso y eficiente.',
    image: 'https://placehold.co/400x400/2A6FAF/ffffff?text=Amalgamador',
    product_type: 'product',
    seller: {
      id: 106,
      username: 'TecnoLab Dental',
      rating: 4.6,
      sales_count: 45
    }
  },
  {
    id: 11,
    name: 'Anestesia Articaína 4% con Epi',
    brand: 'AnestDent',
    category_id: 1,
    category: 'Materiales e Insumos',
    price: 4200,
    stock: 120,
    unit: 'Carpule x 50',
    description: 'Anestésico local de acción rápida. Con vasoconstrictor 1:100.000. Presentación carpules. Vencimiento lejano.',
    image: 'https://placehold.co/400x400/29A68C/ffffff?text=Anestesia',
    product_type: 'product',
    seller: {
      id: 101,
      username: 'Dental Supply BA',
      rating: 4.8,
      sales_count: 234
    }
  },
  {
    id: 12,
    name: 'Guantes de Nitrilo S/Polvo',
    brand: 'SafeGlove',
    category_id: 1,
    category: 'Materiales e Insumos',
    price: 12800,
    stock: 340,
    unit: 'Caja x 100',
    description: 'Guantes de nitrilo descartables, sin polvo. Alta sensibilidad táctil. Disponibles en todos los talles. Color azul.',
    image: 'https://placehold.co/400x400/2A6FAF/ffffff?text=Guantes',
    product_type: 'product',
    seller: {
      id: 111,
      username: 'Bioseguridad Pro',
      rating: 4.9,
      sales_count: 523
    }
  }
]

export const services = [
  {
    id: 101,
    name: 'Corona de Zirconio',
    provider: 'Laboratorio Estético Dental',
    category: 'Prótesis por Encargo',
    service_type: 'prosthesis',
    material: 'Zirconio Multicapa',
    description: 'Corona completa de zirconio multicapa. Alta estética y resistencia. Incluye prueba de metal.',
    delivery_time: '7 días hábiles',
    image: 'https://placehold.co/400x400/29A68C/ffffff?text=Corona+Zirconio',
    pricing_matrix: {
      'corona_total': {
        'anterior': 45000,
        'premolar': 42000,
        'molar': 48000
      },
      'carilla': {
        'anterior': 38000,
        'premolar': 35000,
        'molar': null
      },
      'incrustacion': {
        'anterior': null,
        'premolar': 32000,
        'molar': 35000
      }
    },
    seller: {
      id: 107,
      username: 'Laboratorio Estético Dental',
      rating: 5.0,
      sales_count: 289
    }
  },
  {
    id: 102,
    name: 'Carillas de Porcelana E-MAX',
    provider: 'Protesis Premium',
    category: 'Prótesis por Encargo',
    service_type: 'prosthesis',
    material: 'Disilicato de Litio',
    description: 'Carillas de disilicato de litio. Mínima preparación. Translucidez natural.',
    delivery_time: '5-7 días hábiles',
    image: 'https://placehold.co/400x400/DC8C73/ffffff?text=Carillas',
    pricing_matrix: {
      'carilla': {
        'anterior': 38000,
        'premolar': 35000,
        'molar': null
      }
    },
    seller: {
      id: 108,
      username: 'Protesis Premium',
      rating: 4.9,
      sales_count: 178
    }
  },
  {
    id: 103,
    name: 'Servicio de Modelado en Yeso',
    provider: 'Técnico Lab Express',
    category: 'Modelado y Vaciado',
    service_type: 'plaster_modeling',
    price: 2500,
    unit: 'Por modelo',
    description: 'Vaciado de modelos en yeso piedra a partir de impresiones o escaneos digitales. Zócalos opcionales.',
    delivery_time: '24-48 horas',
    image: 'https://placehold.co/400x400/2A6FAF/ffffff?text=Modelado+Yeso',
    includes: ['Vaciado en yeso tipo IV', 'Recorte y base', 'Control de calidad'],
    seller: {
      id: 109,
      username: 'Técnico Lab Express',
      rating: 4.8,
      sales_count: 412
    }
  },
  {
    id: 104,
    name: 'Alquiler Fotopolimerizadora LED',
    provider: 'Alquiler Equipo Dental',
    category: 'Alquiler de Equipos',
    service_type: 'equipment_rental',
    equipment_name: 'LightCure Pro',
    price_day: 1500,
    price_week: 8000,
    price_month: 25000,
    stock: 3,
    description: 'Lámpara de fotocurado de alta potencia. 2000 mW/cm². Inalámbrica. Incluye seguro contra daños.',
    image: 'https://placehold.co/400x400/29A68C/ffffff?text=Fotopolimerizadora',
    insurance_deposit: 15000,
    includes: ['Seguro contra daños', 'Manual de uso', 'Soporte técnico telefónico'],
    seller: {
      id: 110,
      username: 'Alquiler Equipo Dental',
      rating: 4.7,
      sales_count: 95
    }
  },
  {
    id: 105,
    name: 'Alquiler Compresor Dental Silencioso',
    provider: 'Alquiler Equipo Dental',
    category: 'Alquiler de Equipos',
    service_type: 'equipment_rental',
    equipment_name: 'SilentAir Pro 50L',
    price_day: 2000,
    price_week: 12000,
    price_month: 38000,
    stock: 2,
    description: 'Compresor dental de 50 litros. Bajo nivel de ruido (60dB). Ideal para consultorios temporales.',
    image: 'https://placehold.co/400x400/2A6FAF/ffffff?text=Compresor',
    insurance_deposit: 25000,
    includes: ['Seguro contra daños', 'Instalación incluida', 'Mantenimiento durante el alquiler'],
    seller: {
      id: 110,
      username: 'Alquiler Equipo Dental',
      rating: 4.7,
      sales_count: 95
    }
  },
  {
    id: 106,
    name: 'Puente Fijo de Porcelana',
    provider: 'Laboratorio Estético Dental',
    category: 'Prótesis por Encargo',
    service_type: 'prosthesis',
    material: 'Porcelana sobre Metal',
    description: 'Puente fijo de porcelana sobre metal. Alta resistencia y estética. Precio por unidad (pilar o póntico).',
    delivery_time: '10 días hábiles',
    image: 'https://placehold.co/400x400/DC8C73/ffffff?text=Puente',
    pricing_matrix: {
      'puente': {
        'anterior': 35000,
        'premolar': 33000,
        'molar': 37000
      }
    },
    seller: {
      id: 107,
      username: 'Laboratorio Estético Dental',
      rating: 5.0,
      sales_count: 289
    }
  }
]

export const sellers = [
  {
    id: 101,
    username: 'Dental Supply BA',
    email: 'contacto@dentalsupply.com.ar',
    rating: 4.8,
    sales_count: 234,
    avatar_url: 'https://placehold.co/100x100/2A6FAF/ffffff?text=DS',
    location: 'Buenos Aires, CABA'
  },
  {
    id: 102,
    username: 'Instrumental Profesional',
    email: 'ventas@instrumental.com.ar',
    rating: 4.9,
    sales_count: 156,
    avatar_url: 'https://placehold.co/100x100/29A68C/ffffff?text=IP',
    location: 'Córdoba, Córdoba'
  },
  {
    id: 103,
    username: 'Lab Suministros',
    email: 'lab@suministros.com',
    rating: 4.7,
    sales_count: 89,
    avatar_url: 'https://placehold.co/100x100/DC8C73/ffffff?text=LS',
    location: 'Rosario, Santa Fe'
  },
  {
    id: 104,
    username: 'Equipo Dental Argentina',
    email: 'info@equipodental.com.ar',
    rating: 5.0,
    sales_count: 67,
    avatar_url: 'https://placehold.co/100x100/2A6FAF/ffffff?text=ED',
    location: 'Mendoza, Mendoza'
  },
  {
    id: 105,
    username: 'Esterilización Total',
    email: 'contacto@esterilizacion.com',
    rating: 4.9,
    sales_count: 34,
    avatar_url: 'https://placehold.co/100x100/29A68C/ffffff?text=ET',
    location: 'La Plata, Buenos Aires'
  },
  {
    id: 106,
    username: 'TecnoLab Dental',
    email: 'tecnolab@dental.com.ar',
    rating: 4.6,
    sales_count: 45,
    avatar_url: 'https://placehold.co/100x100/DC8C73/ffffff?text=TL',
    location: 'Tucumán, Tucumán'
  },
  {
    id: 107,
    username: 'Laboratorio Estético Dental',
    email: 'estetico@laboratorio.com',
    rating: 5.0,
    sales_count: 289,
    avatar_url: 'https://placehold.co/100x100/2A6FAF/ffffff?text=LE',
    location: 'CABA, Buenos Aires'
  },
  {
    id: 108,
    username: 'Protesis Premium',
    email: 'premium@protesis.com.ar',
    rating: 4.9,
    sales_count: 178,
    avatar_url: 'https://placehold.co/100x100/29A68C/ffffff?text=PP',
    location: 'Mar del Plata, Buenos Aires'
  },
  {
    id: 109,
    username: 'Técnico Lab Express',
    email: 'express@lab.com',
    rating: 4.8,
    sales_count: 412,
    avatar_url: 'https://placehold.co/100x100/DC8C73/ffffff?text=TE',
    location: 'Salta, Salta'
  },
  {
    id: 110,
    username: 'Alquiler Equipo Dental',
    email: 'alquiler@equipodental.com',
    rating: 4.7,
    sales_count: 95,
    avatar_url: 'https://placehold.co/100x100/2A6FAF/ffffff?text=AE',
    location: 'Neuquén, Neuquén'
  },
  {
    id: 111,
    username: 'Bioseguridad Pro',
    email: 'bioseguridad@pro.com.ar',
    rating: 4.9,
    sales_count: 523,
    avatar_url: 'https://placehold.co/100x100/29A68C/ffffff?text=BP',
    location: 'Córdoba, Villa Carlos Paz'
  }
]

export const news = [
  {
    id: 1,
    title: 'Nuevas normativas de bioseguridad en consultorios odontológicos',
    summary: 'El Ministerio de Salud actualiza protocolos de esterilización y manejo de residuos patológicos.',
    date: '2025-10-15',
    category: 'Normativas',
    image: 'https://placehold.co/600x300/2A6FAF/ffffff?text=Normativas'
  },
  {
    id: 2,
    title: 'Tendencia: Odontología digital y escáneres intraorales',
    summary: 'Los profesionales argentinos adoptan cada vez más la tecnología de escaneo 3D para impresiones digitales.',
    date: '2025-10-12',
    category: 'Tecnología',
    image: 'https://placehold.co/600x300/29A68C/ffffff?text=Escaner+3D'
  },
  {
    id: 3,
    title: 'Jornadas de actualización en implantología',
    summary: 'Se realizará el congreso anual de la Asociación Argentina de Implantología del 5 al 7 de noviembre en CABA.',
    date: '2025-10-08',
    category: 'Eventos',
    image: 'https://placehold.co/600x300/DC8C73/ffffff?text=Congreso'
  },
  {
    id: 4,
    title: 'Descubrimiento: Nuevo biomaterial para regeneración ósea',
    summary: 'Investigadores locales desarrollan un biomaterial que acelera la regeneración ósea en implantes.',
    date: '2025-10-05',
    category: 'Investigación',
    image: 'https://placehold.co/600x300/2A6FAF/ffffff?text=Biomaterial'
  }
]
