/**
 * Archivo de configuración e inicialización del cliente de Supabase.
 * Propósito: Establecer la conexión con los servicios de backend (Auth, DB, Storage)
 * de Supabase, utilizando las variables de entorno definidas en `.env.local`.
 * Funcionamiento: Crea y exporta la instancia del cliente (`supabase`)
 * utilizando `createClient` con la URL y la clave anónima. Configura
 * el cliente para persistir la sesión y refrescar tokens automáticamente.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan las variables de entorno de Supabase. Crea un archivo .env.local basado en .env.example')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
