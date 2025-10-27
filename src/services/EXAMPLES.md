# Ejemplos de Uso de Servicios

Esta guía muestra cómo usar los servicios en componentes Vue siguiendo las mejores prácticas.

## 📋 Tabla de Contenidos

- [Patrón Básico](#patrón-básico)
- [Manejo de Estado de Carga](#manejo-de-estado-de-carga)
- [Manejo de Errores](#manejo-de-errores)
- [Paginación](#paginación)
- [Búsqueda](#búsqueda)
- [Formularios (Crear/Actualizar)](#formularios-crearactualizar)
- [Composables Reutilizables](#composables-reutilizables)

---

## Patrón Básico

### Listar Datos

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { getProducts } from '@/services/products';

const products = ref([]);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  try {
    loading.value = true;
    const result = await getProducts({ page: 1, limit: 20 });
    products.value = result.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div v-if="loading">Cargando productos...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else>
      <div v-for="product in products" :key="product.id">
        <h3>{{ product.name }}</h3>
        <p>${{ product.price }}</p>
      </div>
    </div>
  </div>
</template>
```

### Ver Detalle

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProductById } from '@/services/products';

const route = useRoute();
const product = ref(null);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  try {
    loading.value = true;
    product.value = await getProductById(route.params.id);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div v-if="loading">Cargando...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="product">
      <h1>{{ product.name }}</h1>
      <p>{{ product.description }}</p>
      <p class="price">${{ product.price }}</p>
    </div>
  </div>
</template>
```

---

## Manejo de Estado de Carga

### Múltiples Estados

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { getProducts } from '@/services/products';

const state = ref({
  loading: false,
  error: null,
  data: [],
  isEmpty: false
});

async function loadProducts() {
  state.value.loading = true;
  state.value.error = null;

  try {
    const result = await getProducts({ limit: 20 });
    state.value.data = result.data;
    state.value.isEmpty = result.data.length === 0;
  } catch (err) {
    state.value.error = err.message;
  } finally {
    state.value.loading = false;
  }
}

onMounted(() => loadProducts());
</script>

<template>
  <div>
    <!-- Loading spinner -->
    <div v-if="state.loading" class="spinner">
      Cargando productos...
    </div>

    <!-- Error alert -->
    <div v-else-if="state.error" class="alert alert-error">
      {{ state.error }}
      <button @click="loadProducts">Reintentar</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="state.isEmpty" class="empty-state">
      No hay productos disponibles
    </div>

    <!-- Data -->
    <div v-else class="products-grid">
      <ProductCard
        v-for="product in state.data"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>
```

---

## Manejo de Errores

### Con Mensajes Personalizados

```vue
<script setup>
import { ref } from 'vue';
import { createProduct } from '@/services/products';

const form = ref({
  name: '',
  price: 0,
  description: ''
});

const submitting = ref(false);
const error = ref(null);
const success = ref(false);

async function handleSubmit() {
  submitting.value = true;
  error.value = null;
  success.value = false;

  try {
    await createProduct(form.value);
    success.value = true;

    // Resetear formulario
    form.value = { name: '', price: 0, description: '' };

    // Ocultar mensaje de éxito después de 3s
    setTimeout(() => { success.value = false; }, 3000);

  } catch (err) {
    // Mapear errores a mensajes amigables
    if (err.message.includes('nombre')) {
      error.value = 'Por favor ingresa un nombre válido';
    } else if (err.message.includes('precio')) {
      error.value = 'El precio debe ser mayor a cero';
    } else {
      error.value = 'Hubo un error al crear el producto. Intenta nuevamente.';
    }

    console.error('Error al crear producto:', err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="success" class="alert alert-success">
      ✅ Producto creado exitosamente
    </div>

    <div v-if="error" class="alert alert-error">
      ❌ {{ error }}
    </div>

    <input v-model="form.name" placeholder="Nombre" />
    <input v-model="form.price" type="number" placeholder="Precio" />
    <textarea v-model="form.description" placeholder="Descripción" />

    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Creando...' : 'Crear Producto' }}
    </button>
  </form>
</template>
```

---

## Paginación

```vue
<script setup>
import { ref, watch } from 'vue';
import { getProducts } from '@/services/products';

const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalPages = ref(0);
const products = ref([]);
const loading = ref(false);

async function loadPage(page) {
  loading.value = true;

  try {
    const result = await getProducts({
      page,
      limit: itemsPerPage.value
    });

    products.value = result.data;
    totalPages.value = result.totalPages;
    currentPage.value = page;
  } catch (err) {
    console.error('Error al cargar página:', err);
  } finally {
    loading.value = false;
  }
}

watch(currentPage, (newPage) => {
  loadPage(newPage);
}, { immediate: true });

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}
</script>

<template>
  <div>
    <div class="products-list">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <div class="pagination">
      <button
        @click="prevPage"
        :disabled="currentPage === 1 || loading"
      >
        Anterior
      </button>

      <span>Página {{ currentPage }} de {{ totalPages }}</span>

      <button
        @click="nextPage"
        :disabled="currentPage === totalPages || loading"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>
```

---

## Búsqueda

### Con Debounce

```vue
<script setup>
import { ref, watch } from 'vue';
import { searchProducts } from '@/services/products';

const searchQuery = ref('');
const searchResults = ref([]);
const searching = ref(false);

let debounceTimeout = null;

watch(searchQuery, (newQuery) => {
  // Limpiar timeout anterior
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  // Si el query es muy corto, limpiar resultados
  if (newQuery.length < 2) {
    searchResults.value = [];
    return;
  }

  // Esperar 500ms antes de buscar
  searching.value = true;
  debounceTimeout = setTimeout(async () => {
    try {
      searchResults.value = await searchProducts(newQuery);
    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      searching.value = false;
    }
  }, 500);
});
</script>

<template>
  <div class="search-container">
    <input
      v-model="searchQuery"
      type="search"
      placeholder="Buscar productos..."
      class="search-input"
    />

    <div v-if="searching" class="searching">
      Buscando...
    </div>

    <div v-else-if="searchResults.length > 0" class="results">
      <div
        v-for="product in searchResults"
        :key="product.id"
        class="result-item"
      >
        {{ product.name }} - ${{ product.price }}
      </div>
    </div>

    <div v-else-if="searchQuery.length >= 2" class="no-results">
      No se encontraron resultados
    </div>
  </div>
</template>
```

---

## Formularios (Crear/Actualizar)

### Formulario Completo con Validación

```vue
<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createProduct } from '@/services/products';

const router = useRouter();

const form = ref({
  name: '',
  description: '',
  price: '',
  category: '',
  stock: 0
});

const errors = ref({});
const submitting = ref(false);

const isValid = computed(() => {
  return form.value.name.length >= 3
    && form.value.price > 0
    && form.value.category !== '';
});

function validateField(field) {
  errors.value[field] = null;

  if (field === 'name' && form.value.name.length < 3) {
    errors.value.name = 'El nombre debe tener al menos 3 caracteres';
  }

  if (field === 'price' && form.value.price <= 0) {
    errors.value.price = 'El precio debe ser mayor a 0';
  }

  if (field === 'category' && !form.value.category) {
    errors.value.category = 'Selecciona una categoría';
  }
}

async function handleSubmit() {
  // Validar todos los campos
  Object.keys(form.value).forEach(validateField);

  // Si hay errores, no enviar
  if (Object.values(errors.value).some(e => e !== null)) {
    return;
  }

  submitting.value = true;

  try {
    const newProduct = await createProduct(form.value);

    // Redirigir al detalle del producto
    router.push(`/products/${newProduct.id}`);

  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="product-form">
    <h2>Nuevo Producto</h2>

    <div class="form-group">
      <label>Nombre *</label>
      <input
        v-model="form.name"
        @blur="validateField('name')"
        type="text"
        required
      />
      <span v-if="errors.name" class="error">{{ errors.name }}</span>
    </div>

    <div class="form-group">
      <label>Precio *</label>
      <input
        v-model.number="form.price"
        @blur="validateField('price')"
        type="number"
        min="0"
        step="0.01"
        required
      />
      <span v-if="errors.price" class="error">{{ errors.price }}</span>
    </div>

    <div class="form-group">
      <label>Categoría *</label>
      <select
        v-model="form.category"
        @change="validateField('category')"
        required
      >
        <option value="">Selecciona...</option>
        <option value="electronics">Electrónica</option>
        <option value="clothing">Ropa</option>
        <option value="books">Libros</option>
      </select>
      <span v-if="errors.category" class="error">{{ errors.category }}</span>
    </div>

    <div class="form-group">
      <label>Descripción</label>
      <textarea v-model="form.description" rows="4" />
    </div>

    <div class="form-group">
      <label>Stock</label>
      <input v-model.number="form.stock" type="number" min="0" />
    </div>

    <div class="form-actions">
      <button
        type="submit"
        :disabled="!isValid || submitting"
        class="btn-primary"
      >
        {{ submitting ? 'Creando...' : 'Crear Producto' }}
      </button>

      <button
        type="button"
        @click="router.back()"
        class="btn-secondary"
      >
        Cancelar
      </button>
    </div>
  </form>
</template>
```

---

## Composables Reutilizables

### useResource (Genérico)

```javascript
// composables/useResource.js
import { ref } from 'vue';

export function useResource(fetchFn) {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function execute(...args) {
    loading.value = true;
    error.value = null;

    try {
      data.value = await fetchFn(...args);
      return data.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    data.value = null;
    error.value = null;
    loading.value = false;
  }

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}
```

**Uso:**

```vue
<script setup>
import { onMounted } from 'vue';
import { useResource } from '@/composables/useResource';
import { getProducts } from '@/services/products';

const products = useResource(getProducts);

onMounted(() => {
  products.execute({ page: 1, limit: 20 });
});
</script>

<template>
  <div>
    <div v-if="products.loading.value">Cargando...</div>
    <div v-else-if="products.error.value">{{ products.error.value }}</div>
    <div v-else>
      <div v-for="item in products.data.value.data" :key="item.id">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
```

### usePagination

```javascript
// composables/usePagination.js
import { ref, computed } from 'vue';

export function usePagination(fetchFn, initialLimit = 10) {
  const data = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const currentPage = ref(1);
  const totalPages = ref(0);
  const totalCount = ref(0);
  const limit = ref(initialLimit);

  async function loadPage(page = 1) {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchFn({ page, limit: limit.value });

      data.value = result.data;
      totalPages.value = result.totalPages;
      totalCount.value = result.totalCount;
      currentPage.value = page;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPrevPage = computed(() => currentPage.value > 1);

  function nextPage() {
    if (hasNextPage.value) {
      loadPage(currentPage.value + 1);
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      loadPage(currentPage.value - 1);
    }
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      loadPage(page);
    }
  }

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    limit,
    hasNextPage,
    hasPrevPage,
    loadPage,
    nextPage,
    prevPage,
    goToPage
  };
}
```

**Uso:**

```vue
<script setup>
import { onMounted } from 'vue';
import { usePagination } from '@/composables/usePagination';
import { getProducts } from '@/services/products';

const pagination = usePagination(getProducts, 20);

onMounted(() => {
  pagination.loadPage(1);
});
</script>

<template>
  <div>
    <div v-if="pagination.loading.value">Cargando...</div>

    <div v-else>
      <ProductCard
        v-for="product in pagination.data.value"
        :key="product.id"
        :product="product"
      />

      <div class="pagination">
        <button
          @click="pagination.prevPage()"
          :disabled="!pagination.hasPrevPage.value"
        >
          Anterior
        </button>

        <span>
          {{ pagination.currentPage.value }} / {{ pagination.totalPages.value }}
        </span>

        <button
          @click="pagination.nextPage()"
          :disabled="!pagination.hasNextPage.value"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>
```

---

## 🎯 Resumen

- ✅ **Separar lógica de datos de UI** usando servicios
- ✅ **Manejar estados de carga y error** explícitamente
- ✅ **Validar datos** antes de enviar
- ✅ **Usar composables** para reutilizar lógica común
- ✅ **Mostrar feedback** al usuario (loading, success, error)
- ✅ **Hacer código testeable** abstrayendo servicios

Estos patrones te ayudarán a mantener componentes simples, limpios y fáciles de mantener.
