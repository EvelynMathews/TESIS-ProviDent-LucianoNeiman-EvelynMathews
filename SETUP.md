# Configuración del Proyecto ProviDent

## Para colaboradores: Configuración inicial

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPO]
cd tesis-provident-neiman-mathews
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

**IMPORTANTE:** El proyecto necesita variables de entorno para conectarse a Supabase.

1. Copia el archivo `.env.example` y renómbralo a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Pide las credenciales de Supabase al administrador del proyecto

3. Edita `.env.local` y completa con las credenciales reales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   ```

### 4. Ejecutar el proyecto
```bash
npm run dev
```

### 5. Abrir en el navegador
```
http://localhost:5173
```

## Solución de problemas comunes

### Error: "process is not defined"
Este error ocurre cuando falta el archivo `.env.local`. Asegúrate de:
1. Haber creado el archivo `.env.local` (NO `.env`)
2. Que el archivo tenga las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Reiniciar el servidor de desarrollo después de crear el archivo

### Error: "Faltan las variables de entorno de Supabase"
Verifica que:
1. El archivo se llame exactamente `.env.local`
2. Las variables empiecen con `VITE_`
3. No haya espacios alrededor del `=`
4. Las credenciales sean correctas

## Notas importantes

- **NUNCA** subas el archivo `.env.local` a Git (ya está en `.gitignore`)
- **NUNCA** compartas las credenciales de Supabase en lugares públicos
- Si necesitas agregar nuevas variables de entorno, actualiza también `.env.example`
