# ProviDent

Marketplace de productos y servicios odontológicos. Proyecto de tesis de **Luciano Neiman** y **Evelyn Mathews** para la carrera de Diseño y Programación Web (Da Vinci).

Permite a odontólogos y proveedores:
- Publicar y vender insumos, prótesis, alquileres de equipos y servicios de yeso.
- Comprar con carrito, domicilios de entrega y pago con Mercado Pago (Checkout Pro).
- Coordinar envíos con el vendedor.
- Gestionar ventas, cobros y liquidaciones desde el panel de administración.

## Stack

- Vue 3 + Vite + Tailwind CSS v4
- Supabase (Postgres, Auth, Storage, Edge Functions)
- Mercado Pago Checkout Pro (Edge Functions en `supabase/functions/`)
- Deploy en Vercel

## Instalación

### Requisitos previos
- Node.js 16+
- npm

### Pasos

1. Clonar el repositorio

```bash
git clone git@github.com:EvelynMathews/TESIS-ProviDent-LucianoNeiman-EvelynMathews.git
cd TESIS-ProviDent-LucianoNeiman-EvelynMathews
```

2. Instalar dependencias

```bash
npm install
```

3. Variables de entorno

Copiar `.env.example` a `.env.local` y completar con las credenciales de Supabase (Project Settings → API):

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

## Accesos

- Sitio local: http://localhost:5173
- Panel de administración: http://localhost:5173/admin/login
- Sitio desplegado: https://provident-omega.vercel.app

Las credenciales de prueba (admin y usuario con productos) están en `datos-users-ejemplo.txt`.

## Base de datos

- Dashboard: https://supabase.com/dashboard/project/ptnyqciqjzpuekwslbcv
- Scripts SQL iniciales y patches incrementales: `docs/database/`

La app corre local pero se conecta a la base de datos real de Supabase, así que los datos son los mismos que en producción.

## Pagos

La integración de Mercado Pago (Checkout Pro) está documentada en [`docs/MERCADOPAGO.md`](docs/MERCADOPAGO.md). Las Edge Functions (`create-checkout`, `mp-webhook`, `verify-payment`) se despliegan desde `supabase/functions/` con la CLI de Supabase.

## Estructura

```
src/
├── pages/           Vistas enrutadas (Home, Productos, Checkout, Mi perfil, admin, etc.)
├── components/      Componentes reutilizables (Navbar, ProductCard, formularios, etc.)
├── services/        Acceso a Supabase y lógica de dominio (auth, cart, products, checkout…)
├── router/          Vue Router (rutas lazy, meta títulos, scrollBehavior, catch-all)
├── data/            Constantes y catálogo
└── style.css        Clases utilitarias de formulario y tokens globales
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción en `dist/`
- `npm run preview` — preview local del build

## Estado del proyecto

En etapa de cierre para la pre-tesis. Las funcionalidades principales (auth, catálogo, carrito, checkout con MP, panel admin, ventas y liquidaciones) están operativas. Los pendientes abiertos están en [`TO-DO.txt`](TO-DO.txt).

---

Proyecto de tesis — Luciano Neiman & Evelyn Mathews
