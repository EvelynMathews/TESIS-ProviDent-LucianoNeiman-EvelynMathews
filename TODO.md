# TODO - Limpieza Post-Migración

## ⚠️ CRÍTICO - Seguridad

- [ ] **BORRAR** la línea `SUPABASE_SERVICE_ROLE_KEY` del archivo `.env.local` (líneas 4-6)
  - Esta key tiene permisos de administrador
  - NO debe estar en el código
  - Archivo: `.env.local`

## 🗑️ Archivos Temporales

- [ ] **BORRAR** `run-migration.js`
  - Script temporal para ejecutar la primera migración (falló)
  - Ya no se necesita

- [ ] **BORRAR** `run-recreate-migration.js`
  - Script temporal para recrear la tabla addresses
  - Ya ejecutado exitosamente

- [ ] **BORRAR** `supabase-addresses-migration.sql`
  - SQL de migración original (no se usó)
  - Opcional: mantener como respaldo

- [ ] **BORRAR** `recreate-addresses-migration.sql`
  - SQL de recreación ejecutado
  - Opcional: mantener como respaldo

- [ ] **BORRAR** este archivo `TODO.md` después de completar las tareas

## ✅ Verificaciones

- [ ] Verificar en Supabase Dashboard que la tabla `addresses` tiene la NUEVA estructura:
  - URL: https://supabase.com/dashboard/project/kxgmjqeaxlrfpltanzui/editor
  - ✅ Debe tener las columnas: `id`, `user_id`, `street`, `city`, `province`, `postal_code`, `country`, `is_primary`, `created_at`, `updated_at`
  - ❌ NO debe tener: `line1`, `line2`, `province_id`, `is_default` (estructura anterior)

- [ ] Probar registro de nuevo usuario con todos los datos:
  - Nombre, apellido, teléfono
  - Dirección completa (calle, ciudad, provincia, código postal)

- [ ] Probar edición de perfil en `/mi-perfil/editar`

- [ ] Verificar que se guarden correctamente en las tablas:
  - `users` (first_name, last_name, phone)
  - `user_profiles` (location)
  - `addresses` (street, city, province, postal_code, country)
