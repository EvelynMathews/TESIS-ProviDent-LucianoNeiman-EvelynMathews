// Encabezados CORS para que el frontend (Vite / sitio publicado) pueda llamar a las funciones.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Error de negocio con un código que el frontend traduce a un mensaje claro. */
export function fail(code: string, message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return json({ error: { code, message, ...extra } }, status)
}
