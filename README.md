# ProviDent

Marketplace de productos odontológicos - Proyecto en construcción.
Incluye funcionalidades como CRUD de productos y servicios, relacion entre proveedor y comprador. Tambien tenemos un chat global que aún esta en produccion, pero estará para la tesis. Hay métodos de envío, hay registro e inicio de sesion verificados.

## Instalación

### Requisitos previos
- Node.js 16+
- npm

### Pasos de instalación

1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd tesis-provident-neiman-mathews
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno

Crear archivo  `.env.local`, despues completar con las credenciales de Supabase:

VITE_SUPABASE_URL=https://kxgmjqeaxlrfpltanzui.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z21qcWVheGxyZnBsdGFuenVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzYxNDUsImV4cCI6MjA3NzE1MjE0NX0.gfumI0-DuO9vQJB3xL2AzFrhVjednzvpTZEVxWmnofA


```bash
cp . .env.local
```

4. Ejecutar en modo desarrollo
```bash
npm run dev
```

5. Abrir en el navegador
```
http://localhost:5173
```

## Estado del proyecto

**En construcción**

---

Proyecto de tesis - Luciano Neiman & Evelyn Mathews
