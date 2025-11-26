import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

// usar service role key para operaciones de admin
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function uploadNewsImage(slug, imagePath, altText, isPrimary = true) {
  try {
    // Get news by slug
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('id, title')
      .eq('slug', slug)
      .single()

    if (newsError || !news) {
      throw new Error(`No se encontró la noticia con slug: ${slug}`)
    }

    // Read image file
    const imageBuffer = fs.readFileSync(imagePath)
    const fileName = path.basename(imagePath)
    const fileExt = path.extname(fileName)
    const storagePath = `${news.id}/${Date.now()}${fileExt}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(storagePath, imageBuffer, {
        contentType: `image/${fileExt.replace('.', '')}`,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Error subiendo imagen: ${uploadError.message}`)
    }

    // Get next position
    const { data: existingImages } = await supabase
      .from('news_images')
      .select('position')
      .eq('news_id', news.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existingImages && existingImages.length > 0
      ? existingImages[0].position + 1
      : 1

    // Insert record in news_images
    const { data: imageRecord, error: imageError } = await supabase
      .from('news_images')
      .insert({
        news_id: news.id,
        path: uploadData.path,
        alt_text: altText,
        position: nextPosition,
        is_primary: isPrimary
      })
      .select()
      .single()

    if (imageError) {
      // Rollback - delete uploaded file
      await supabase.storage.from('news-images').remove([uploadData.path])
      throw new Error(`Error creando registro: ${imageError.message}`)
    }

  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Usage: node scripts/upload-news-image.js
const slug = 'descubrimiento-biomaterial-regeneracion-osea'
const imagePath = path.join(__dirname, 'news-images', 'descubrimiento-biomaterial.png')
const altText = 'Investigación científica sobre biomateriales para regeneración ósea dental'

uploadNewsImage(slug, imagePath, altText, true)
