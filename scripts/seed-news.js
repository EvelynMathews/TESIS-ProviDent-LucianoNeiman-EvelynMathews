import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const news = [
  {
    title: 'Nuevas normativas de bioseguridad en consultorios odontológicos',
    slug: 'nuevas-normativas-bioseguridad-consultorios',
    preview: 'El Ministerio de Salud actualizó los protocolos de esterilización y manejo de residuos patológicos para todos los consultorios del país.',
    content: `El Ministerio de Salud de la Nación publicó las nuevas normativas de bioseguridad que todos los consultorios odontológicos deben cumplir a partir del próximo mes.

Los cambios más importantes incluyen protocolos actualizados de esterilización de instrumental, nuevas exigencias en el manejo de residuos patológicos y requisitos más estrictos para la ventilación de los espacios de atención.

Según explicaron desde la cartera sanitaria, estas modificaciones buscan elevar los estándares de seguridad tanto para profesionales como para pacientes, alineándose con las recomendaciones internacionales más recientes.

Los consultorios tendrán un plazo de 90 días para adaptarse a las nuevas exigencias, y habrá capacitaciones gratuitas disponibles para todo el personal odontológico.

Para más información, los profesionales pueden consultar en la página oficial del Ministerio de Salud o contactarse con los colegios odontológicos de cada provincia.`,
    is_published: true,
    published_at: new Date('2024-10-15').toISOString()
  },
  {
    title: 'Tendencia: Odontología digital y escáneres intraorales',
    slug: 'tendencia-odontologia-digital-escaneres-intraorales',
    preview: 'Cada vez más profesionales argentinos están adoptando la tecnología de escaneo 3D para impresiones digitales, mejorando la precisión y comodidad.',
    content: `La odontología digital llegó para quedarse en Argentina. Cada vez más consultorios están incorporando escáneres intraorales que reemplazan las incómodas impresiones tradicionales.

Esta tecnología permite crear modelos 3D de la boca del paciente de forma rápida y precisa, eliminando la necesidad de materiales de impresión que muchas veces generan incomodidad y náuseas.

"La diferencia es abismal", cuenta la Dra. María Fernández, odontóloga de Palermo. "Los pacientes están mucho más cómodos y yo tengo modelos digitales más precisos que puedo compartir instantáneamente con el laboratorio".

Los laboratorios protésicos también se están adaptando a esta nueva realidad, incorporando impresoras 3D y software de diseño asistido por computadora (CAD/CAM) para fabricar prótesis con mayor precisión y en menos tiempo.

Si bien la inversión inicial puede ser considerable, los profesionales que ya dieron el salto aseguran que vale la pena tanto por la mejora en la calidad del trabajo como por la diferenciación que genera frente a la competencia.`,
    is_published: true,
    published_at: new Date('2024-10-12').toISOString()
  },
  {
    title: 'Jornadas de actualización en implantología',
    slug: 'jornadas-actualizacion-implantologia',
    preview: 'Se viene el congreso anual de la Asociación Argentina de Implantología del 5 al 7 de noviembre en CABA con destacados expertos internacionales.',
    content: `Ya está confirmado el congreso anual de la Asociación Argentina de Implantología (AAI) que se realizará del 5 al 7 de noviembre en el Hotel Sheraton de Buenos Aires.

Este año, el evento promete ser uno de los más importantes de la década, con la participación de reconocidos especialistas de Brasil, España y Estados Unidos que compartirán las últimas tendencias en implantología y cirugía oral.

Entre los temas que se van a tratar están los nuevos materiales para implantes, técnicas mínimamente invasivas, manejo de casos complejos con poco hueso disponible y el uso de tecnología digital en la planificación de tratamientos.

La inscripción ya está abierta y hay descuentos para socios de la AAI y para estudiantes. Además, este año van a transmitir algunas conferencias en vivo para quienes no puedan viajar a Buenos Aires.

Es una oportunidad imperdible para actualizarse, hacer networking con colegas de todo el país y conocer las últimas novedades en equipamiento e insumos que van a estar presentes los principales proveedores del sector.`,
    is_published: true,
    published_at: new Date('2024-10-08').toISOString()
  },
  {
    title: 'Descubrimiento: Nuevo biomaterial para regeneración ósea',
    slug: 'descubrimiento-biomaterial-regeneracion-osea',
    preview: 'Investigadores argentinos desarrollaron un biomaterial que acelera la regeneración ósea en implantes, revolucionando los tratamientos complejos.',
    content: `Un equipo de investigadores del CONICET y la Universidad de Buenos Aires desarrolló un innovador biomaterial que promete revolucionar los tratamientos de implantología en casos con pérdida ósea.

El nuevo material, que ya fue probado con éxito en estudios preclínicos, combina hidroxiapatita sintética con factores de crecimiento que estimulan la formación de hueso nuevo de manera más rápida y efectiva que los materiales tradicionales.

"Lo que logramos es un biomaterial que no solo sirve como relleno, sino que activamente promueve la regeneración del hueso del paciente", explica el Dr. Roberto Gómez, líder del proyecto. "Los tiempos de espera antes de colocar el implante se podrían reducir significativamente".

El descubrimiento es especialmente relevante para Argentina, donde muchos pacientes con pérdida ósea no pueden acceder a tratamientos con materiales importados por su alto costo. Este nuevo material podría fabricarse localmente a un precio mucho más accesible.

Actualmente, el equipo está en conversaciones con laboratorios nacionales para iniciar la fase de pruebas clínicas en humanos. Si todo sale bien, el producto podría estar disponible en el mercado en aproximadamente dos años.`,
    is_published: true,
    published_at: new Date('2024-10-05').toISOString()
  }
]

async function seedNews() {
  console.log('Insertando noticias...')

  for (const item of news) {
    const { data, error } = await supabase
      .from('news')
      .insert(item)
      .select('id, title')
      .single()

    if (error) {
      console.error(`Error insertando "${item.title}":`, error.message)
    } else {
      console.log(`✓ Insertada: ${data.title} (ID: ${data.id})`)
    }
  }

  console.log('Listo!')
}

seedNews()
