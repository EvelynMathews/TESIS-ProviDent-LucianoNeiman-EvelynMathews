# Configuración de Supabase

## Configuración Completada ✅

Ya está configurado Supabase en el proyecto con las siguientes credenciales:

- **URL**: https://kxgmjqeaxlrfpltanzui.supabase.co
- **Project ID**: kxgmjqeaxlrfpltanzui
- **Anon Key**: Configurado en `.env.local`

## Archivos Modificados

1. **`.env.local`** (creado) - Contiene las credenciales de Supabase
2. **`src/services/supabase.js`** - Actualizado para usar variables de entorno
3. **`src/services/testSupabase.js`** (creado) - Función de prueba de conexión
4. **`src/main.js`** - Agrega test automático al iniciar
5. **`.env.example`** (creado) - Template para configuración

## Probar la Conexión

### Opción 1: Ejecutar el proyecto

```bash
npm run dev
```

Abre la consola del navegador (F12) y deberías ver:

```
✅ Conexión a Supabase exitosa
Provinces: [
  { name: "Buenos Aires", enabled: true },
  { name: "Ciudad Autónoma de Buenos Aires", enabled: true },
  ...
]
```

### Opción 2: Probar desde cualquier componente

Importa el cliente de Supabase y úsalo:

```javascript
import { supabase } from '@/services/supabase';

async function getData() {
  const { data, error } = await supabase
    .from('provinces')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}
```

## Estructura de Variables de Entorno

Las variables en Vite deben tener el prefijo `VITE_`:

```env
VITE_SUPABASE_URL=https://kxgmjqeaxlrfpltanzui.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Se acceden con `import.meta.env.VITE_NOMBRE_VARIABLE`

## Eliminar Test Automático

Si querés eliminar el test automático que se ejecuta al iniciar, simplemente borra estas líneas de `src/main.js`:

```javascript
import { testSupabaseConnection } from './services/testSupabase'
testSupabaseConnection();
```

## Tablas Disponibles en Supabase

Según tu proyecto, debería haber estas tablas:
- `provinces` - Provincias
- (y otras que tengas en tu proyecto)

Podés verificar en: https://supabase.com/dashboard/project/kxgmjqeaxlrfpltanzui/editor

## Configuración Adicional

### Service Role Key (Backend)

Si necesitás hacer operaciones desde el backend con permisos completos, usá el Service Role Key:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z21qcWVheGxyZnBsdGFuenVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NjE0NSwiZXhwIjoyMDc3MTUyMTQ1fQ.zWvxFYvkBJ1KiWt54FLT6PZTxiQ5bETGeK5NxhikDiY
```

**⚠️ IMPORTANTE:** El Service Role Key tiene permisos completos. NUNCA lo expongas en el frontend.

### Dashboard de Supabase

- **Project Dashboard**: https://supabase.com/dashboard/project/kxgmjqeaxlrfpltanzui
- **Table Editor**: https://supabase.com/dashboard/project/kxgmjqeaxlrfpltanzui/editor
- **SQL Editor**: https://supabase.com/dashboard/project/kxgmjqeaxlrfpltanzui/sql
- **API Docs**: https://supabase.com/dashboard/project/kxgmjqeaxlrfpltanzui/api

## Ejemplos de Uso

### Leer datos

```javascript
const { data, error } = await supabase
  .from('provinces')
  .select('*')
  .eq('enabled', true);
```

### Insertar datos

```javascript
const { data, error } = await supabase
  .from('provinces')
  .insert({ name: 'Nueva Provincia', enabled: true });
```

### Actualizar datos

```javascript
const { data, error } = await supabase
  .from('provinces')
  .update({ enabled: false })
  .eq('id', 1);
```

### Eliminar datos

```javascript
const { data, error } = await supabase
  .from('provinces')
  .delete()
  .eq('id', 1);
```

### Real-time (suscripciones)

```javascript
const channel = supabase
  .channel('provinces-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'provinces' },
    (payload) => {
      console.log('Change detected:', payload);
    }
  )
  .subscribe();
```

## Troubleshooting

### Error: "supabase is not defined"

Asegúrate de importar el cliente:
```javascript
import { supabase } from '@/services/supabase';
```

### Error: "Faltan variables de entorno"

1. Verifica que existe `.env.local` en la raíz del proyecto
2. Verifica que las variables tengan el prefijo `VITE_`
3. Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "relation does not exist"

La tabla no existe en Supabase. Verifica:
1. El nombre de la tabla es correcto (case-sensitive)
2. La tabla existe en el Table Editor
3. Tenés permisos para acceder a la tabla (RLS policies)

### Error de CORS

Si tenés problemas de CORS, verifica en Supabase:
1. Settings > API > API Settings
2. Agrega tu dominio a "Allowed origins"

## Seguridad

- ✅ `.env.local` está en `.gitignore` (no se sube a git)
- ✅ Usa Anon Key en el frontend (seguro de exponer)
- ❌ NUNCA uses Service Role Key en el frontend
- ✅ Configura Row Level Security (RLS) en Supabase para proteger datos

## Referencias

- [Documentación Supabase](https://supabase.com/docs)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Vue + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-vue-3)
