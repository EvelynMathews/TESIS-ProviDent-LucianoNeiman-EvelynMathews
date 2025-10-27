# Servicios - Arquitectura y Mejores Prácticas

## 📚 Arquitectura de Servicios

Los servicios son la **capa de abstracción** entre los componentes Vue y Supabase. Su objetivo es:

- ✅ Encapsular toda la lógica de acceso a datos
- ✅ Centralizar las operaciones CRUD
- ✅ Facilitar el testing (mock/stub de servicios)
- ✅ Mejorar la reutilización de código
- ✅ Mantener componentes Vue simples y enfocados en UI

## 🏗️ Estructura de Directorios

```
src/services/
├── supabase.js              # Cliente de Supabase (configuración)
├── auth.js                  # Autenticación y sesión
├── user-profiles.js         # Perfiles de usuario
├── cart.js                  # Carrito de compras (estado local)
├── follows.js               # Sistema de follows
├── global-chat.js           # Chat global
├── testSupabase.js          # Utilidad para testing
├── products.js              # [EJEMPLO] Productos
├── orders.js                # [EJEMPLO] Órdenes
└── README.md                # Esta documentación
```

## ✨ Patrón de Diseño

### 1. Importar Cliente de Supabase

```javascript
import { supabase } from './supabase';
```

**Importante:** Siempre importar desde `./supabase.js`, nunca crear instancias nuevas.

### 2. Exportar Funciones Específicas

Cada operación debe ser una función exportada con nombre descriptivo:

```javascript
// ✅ CORRECTO: Función específica y descriptiva
export async function getUserById(id) { ... }
export async function createUser(userData) { ... }
export async function updateUser(id, updates) { ... }
export async function deleteUser(id) { ... }

// ❌ INCORRECTO: Operaciones genéricas
export async function query(table, filters) { ... }
export async function execute(operation, data) { ... }
```

### 3. Manejo de Errores

Siempre capturar errores de Supabase y lanzar excepciones claras:

```javascript
export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[users.js getUserById] Error:', error);
    throw new Error(`No se pudo obtener el usuario: ${error.message}`);
  }

  return data;
}
```

### 4. Documentación con JSDoc

Documenta parámetros, retornos y posibles errores:

```javascript
/**
 * Obtiene un usuario por su ID.
 *
 * @param {string} id - ID del usuario
 * @returns {Promise<Object>} Datos del usuario
 * @throws {Error} Si el usuario no existe o hay error de red
 *
 * @example
 * const user = await getUserById('123');
 * console.log(user.email);
 */
export async function getUserById(id) { ... }
```

### 5. Logs para Debugging

Usar prefijos claros en logs de error:

```javascript
console.error('[nombre-servicio.js nombreFuncion] Mensaje:', error);
// Ejemplo:
console.error('[products.js getProductById] Error al obtener producto:', error);
```

## 📝 Template de Servicio

Usa este template como base para nuevos servicios:

```javascript
// src/services/example.js

import { supabase } from './supabase';

/**
 * Obtiene todos los registros con paginación.
 *
 * @param {number} page - Número de página (1-indexed)
 * @param {number} limit - Registros por página
 * @returns {Promise<Array>} Lista de registros
 */
export async function getAll(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .range(from, to);

  if (error) {
    console.error('[example.js getAll] Error:', error);
    throw new Error(`Error al obtener registros: ${error.message}`);
  }

  return data;
}

/**
 * Obtiene un registro por ID.
 *
 * @param {string} id - ID del registro
 * @returns {Promise<Object>} Datos del registro
 */
export async function getById(id) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[example.js getById] Error:', error);
    throw new Error(`Error al obtener registro: ${error.message}`);
  }

  return data;
}

/**
 * Crea un nuevo registro.
 *
 * @param {Object} recordData - Datos del nuevo registro
 * @returns {Promise<Object>} Registro creado
 */
export async function create(recordData) {
  const { data, error } = await supabase
    .from('table_name')
    .insert([recordData])
    .select()
    .single();

  if (error) {
    console.error('[example.js create] Error:', error);
    throw new Error(`Error al crear registro: ${error.message}`);
  }

  return data;
}

/**
 * Actualiza un registro existente.
 *
 * @param {string} id - ID del registro
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Registro actualizado
 */
export async function update(id, updates) {
  const { data, error } = await supabase
    .from('table_name')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[example.js update] Error:', error);
    throw new Error(`Error al actualizar registro: ${error.message}`);
  }

  return data;
}

/**
 * Elimina un registro.
 *
 * @param {string} id - ID del registro
 * @returns {Promise<void>}
 */
export async function deleteRecord(id) {
  const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[example.js deleteRecord] Error:', error);
    throw new Error(`Error al eliminar registro: ${error.message}`);
  }
}
```

## 🎯 Uso en Componentes Vue

### ✅ CORRECTO: Usar servicios

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { getUserById, updateUser } from '@/services/user-profiles';

const user = ref(null);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  try {
    loading.value = true;
    user.value = await getUserById('123');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

async function saveProfile() {
  try {
    loading.value = true;
    await updateUser(user.value.id, {
      username: user.value.username,
      bio: user.value.bio
    });
    alert('Perfil actualizado');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div v-if="loading">Cargando...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else-if="user">
    <h1>{{ user.username }}</h1>
    <button @click="saveProfile">Guardar</button>
  </div>
</template>
```

### ❌ INCORRECTO: Usar Supabase directamente

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/services/supabase'; // ❌ NO hacer esto

onMounted(async () => {
  const { data, error } = await supabase  // ❌ NO hacer esto
    .from('users')
    .select('*')
    .eq('id', '123')
    .single();

  // ... código acoplado a Supabase
});
</script>
```

**Problemas de este enfoque:**
- ❌ Componente acoplado a Supabase
- ❌ Lógica de negocio mezclada con UI
- ❌ Difícil de testear
- ❌ No reutilizable
- ❌ Cambios en esquema afectan múltiples componentes

## 🧪 Testing

Los servicios facilitan el testing con mocks:

```javascript
// tests/components/UserProfile.test.js
import { mount } from '@vue/test-utils';
import UserProfile from '@/components/UserProfile.vue';
import * as userService from '@/services/user-profiles';

// Mock del servicio
vi.mock('@/services/user-profiles', () => ({
  getUserById: vi.fn().mockResolvedValue({
    id: '123',
    username: 'testuser',
    email: 'test@example.com'
  })
}));

test('carga el perfil del usuario', async () => {
  const wrapper = mount(UserProfile, {
    props: { userId: '123' }
  });

  await wrapper.vm.$nextTick();

  expect(userService.getUserById).toHaveBeenCalledWith('123');
  expect(wrapper.text()).toContain('testuser');
});
```

## 📊 Operaciones Comunes

### Paginación

```javascript
export async function getPaginated(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('table_name')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return {
    data,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  };
}
```

### Búsqueda

```javascript
export async function search(query) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (error) throw new Error(error.message);
  return data;
}
```

### Relaciones (JOINs)

```javascript
export async function getWithRelations(id) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:user_id (
        id,
        username,
        email
      ),
      items:order_items (
        id,
        quantity,
        product:product_id (
          name,
          price
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

### Real-time (Subscriptions)

```javascript
export function subscribeToChanges(callback) {
  const channel = supabase
    .channel('table-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'table_name' },
      (payload) => callback(payload)
    )
    .subscribe();

  // Retornar función de cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}

// Uso en componente:
onMounted(() => {
  const unsubscribe = subscribeToChanges((payload) => {
    console.log('Cambio detectado:', payload);
  });

  onUnmounted(() => {
    unsubscribe();
  });
});
```

## 🔒 Seguridad

### Row Level Security (RLS)

Los servicios respetan automáticamente las políticas RLS de Supabase:

```sql
-- Ejemplo de política RLS en Supabase
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);
```

Tu servicio funcionará automáticamente:

```javascript
// Solo retorna el perfil si el usuario actual lo posee
export async function getOwnProfile() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .single(); // RLS filtra automáticamente

  if (error) throw new Error(error.message);
  return data;
}
```

### Validación

Valida datos antes de enviar a Supabase:

```javascript
export async function createProduct(productData) {
  // Validar datos
  if (!productData.name || productData.name.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres');
  }

  if (!productData.price || productData.price <= 0) {
    throw new Error('El precio debe ser mayor a 0');
  }

  // Sanitizar
  const sanitized = {
    name: productData.name.trim(),
    price: parseFloat(productData.price),
    description: productData.description?.trim() || ''
  };

  const { data, error } = await supabase
    .from('products')
    .insert([sanitized])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

## 📚 Recursos

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [Testing Vue Components](https://test-utils.vuejs.org/)

## 🎓 Resumen de Mejores Prácticas

1. ✅ **Un servicio por entidad/dominio** (users, products, orders)
2. ✅ **Funciones específicas** con nombres descriptivos
3. ✅ **Siempre manejar errores** y lanzar excepciones claras
4. ✅ **Documentar con JSDoc** parámetros y retornos
5. ✅ **Logs con prefijos** para debugging
6. ✅ **Validar datos** antes de enviar a Supabase
7. ✅ **No exponer Supabase** en componentes Vue
8. ✅ **Facilitar testing** con funciones mockeables
9. ✅ **Retornar datos procesados**, no respuestas crudas de Supabase
10. ✅ **Aprovechar RLS** de Supabase para seguridad

---

**¿Necesitás agregar un nuevo servicio?** Copia el template de arriba y adaptalo a tu entidad.
