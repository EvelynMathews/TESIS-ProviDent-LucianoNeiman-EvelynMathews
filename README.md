# ProviDent

Marketplace de productos odontológicos - Proyecto en construcción.
Incluye funcionalidades como CRUD de productos y servicios, relacion entre proveedor y comprador. El soporte se atiende por WhatsApp y email desde la sección Soporte (datos en `src/config/support.js`). Hay métodos de envío, hay registro e inicio de sesion verificados.

## Instalación

### Requisitos previos
- Node.js 16+
- npm

### Pasos de instalación

1. Clonar el repositorio
```bash
git clone git@github.com:EvelynMathews/TESIS-ProviDent-LucianoNeiman-EvelynMathews.git
cd TESIS-ProviDent-LucianoNeiman-EvelynMathews
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno

Copiar el archivo de ejemplo y completar con las credenciales de Supabase (Project Settings → API):

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://ptnyqciqjzpuekwslbcv.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

4. Ejecutar en modo desarrollo
```bash
npm run dev
```

5. Abrir en el navegador
- Sitio: http://localhost:5173
- Panel admin: http://localhost:5173/admin/login

La app corre local pero se conecta a la base de datos real de Supabase, así que los datos son los mismos que en producción.

## Base de datos

- Dashboard de Supabase: https://supabase.com/dashboard/project/ptnyqciqjzpuekwslbcv
- Scripts SQL y patches en `docs/database/`.

## Estado del proyecto

**En construcción**

---

Proyecto de tesis - Luciano Neiman & Evelyn Mathews
