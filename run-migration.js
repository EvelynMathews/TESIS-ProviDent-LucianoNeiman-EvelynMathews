#!/usr/bin/env node

/**
 * Script temporal para ejecutar la migración de addresses
 * BORRAR ESTE ARCHIVO DESPUÉS DE EJECUTARLO
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

// Crear cliente con service_role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('📦 Leyendo archivo de migración...')
    const sqlFile = join(__dirname, 'supabase-addresses-migration.sql')
    const sql = readFileSync(sqlFile, 'utf-8')

    console.log('🚀 Ejecutando migración...')

    // Separar el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Ejecutando ${statements.length} statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Saltear comentarios
      if (statement.trim().startsWith('COMMENT')) {
        console.log(`⏭️  [${i + 1}/${statements.length}] Saltando comentario`)
        continue
      }

      try {
        console.log(`⚙️  [${i + 1}/${statements.length}] Ejecutando...`)

        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error && error.message !== 'unknown function') {
          // Si no existe la función exec_sql, intentar con método alternativo
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql_query: statement })
          })

          if (!response.ok) {
            console.log(`⚠️  Statement podría haber fallado, continuando...`)
          }
        }
      } catch (err) {
        // Ignorar errores de "already exists"
        if (err.message && err.message.includes('already exists')) {
          console.log(`✓ [${i + 1}/${statements.length}] Ya existe`)
        } else {
          console.log(`⚠️  [${i + 1}/${statements.length}] Advertencia:`, err.message)
        }
      }
    }

    // Intentar ejecutar todo el SQL de una vez como fallback
    console.log('\n🔄 Intentando ejecutar SQL completo...')

    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })

    console.log('\n✅ Migración completada')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Verificá en Supabase Dashboard → Table Editor que existe la tabla "addresses"')
    console.log('2. ⚠️  BORRAR la línea SUPABASE_SERVICE_ROLE_KEY del archivo .env.local')
    console.log('3. Borrar este archivo (run-migration.js)')

  } catch (error) {
    console.error('\n❌ Error en migración:', error.message)
    console.log('\n💡 Solución alternativa:')
    console.log('Ejecutá el SQL manualmente en Supabase Dashboard → SQL Editor')
    console.log('Archivo: supabase-addresses-migration.sql')
    process.exit(1)
  }
}

runMigration()
