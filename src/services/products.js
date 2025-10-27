/**
 * Servicio de Productos
 *
 * Maneja todas las operaciones CRUD relacionadas con productos.
 * Este servicio abstrae la lógica de acceso a datos de Supabase.
 */

import { supabase } from './supabase';

/**
 * Obtiene todos los productos con paginación.
 *
 * @param {Object} options - Opciones de consulta
 * @param {number} [options.page=1] - Número de página (1-indexed)
 * @param {number} [options.limit=10] - Productos por página
 * @param {string} [options.category] - Filtrar por categoría
 * @param {string} [options.sortBy='created_at'] - Campo para ordenar
 * @param {boolean} [options.ascending=false] - Orden ascendente
 * @returns {Promise<Object>} Objeto con data, totalCount, totalPages, currentPage
 * @throws {Error} Si hay error en la consulta
 *
 * @example
 * const result = await getProducts({ page: 1, limit: 20, category: 'electronics' });
 * console.log(result.data); // Array de productos
 * console.log(result.totalPages); // Total de páginas
 */
export async function getProducts(options = {}) {
  const {
    page = 1,
    limit = 10,
    category = null,
    sortBy = 'created_at',
    ascending = false
  } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order(sortBy, { ascending });

  // Aplicar filtro de categoría si existe
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[products.js getProducts] Error al obtener productos:', error);
    throw new Error(`Error al obtener productos: ${error.message}`);
  }

  return {
    data,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  };
}

/**
 * Obtiene un producto por su ID.
 *
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Datos del producto
 * @throws {Error} Si el producto no existe o hay error de red
 *
 * @example
 * const product = await getProductById('123');
 * console.log(product.name);
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[products.js getProductById] Error al obtener producto:', id, error);
    throw new Error(`Error al obtener producto: ${error.message}`);
  }

  return data;
}

/**
 * Busca productos por nombre o descripción.
 *
 * @param {string} query - Término de búsqueda
 * @param {number} [limit=20] - Límite de resultados
 * @returns {Promise<Array>} Array de productos que coinciden
 * @throws {Error} Si hay error en la búsqueda
 *
 * @example
 * const results = await searchProducts('laptop');
 */
export async function searchProducts(query, limit = 20) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('[products.js searchProducts] Error en búsqueda:', error);
    throw new Error(`Error al buscar productos: ${error.message}`);
  }

  return data;
}

/**
 * Crea un nuevo producto.
 *
 * @param {Object} productData - Datos del nuevo producto
 * @param {string} productData.name - Nombre del producto
 * @param {string} productData.description - Descripción
 * @param {number} productData.price - Precio
 * @param {string} [productData.category] - Categoría
 * @param {string} [productData.image_url] - URL de imagen
 * @returns {Promise<Object>} Producto creado
 * @throws {Error} Si los datos son inválidos o hay error al crear
 *
 * @example
 * const newProduct = await createProduct({
 *   name: 'Laptop Dell',
 *   description: 'Laptop de alto rendimiento',
 *   price: 1500000,
 *   category: 'electronics'
 * });
 */
export async function createProduct(productData) {
  // Validaciones
  if (!productData.name || productData.name.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres');
  }

  if (!productData.price || productData.price <= 0) {
    throw new Error('El precio debe ser mayor a 0');
  }

  // Sanitizar y preparar datos
  const sanitized = {
    name: productData.name.trim(),
    description: productData.description?.trim() || '',
    price: parseFloat(productData.price),
    category: productData.category?.trim() || null,
    image_url: productData.image_url?.trim() || null,
    stock: productData.stock ?? 0,
    seller_id: productData.seller_id
  };

  const { data, error } = await supabase
    .from('products')
    .insert([sanitized])
    .select()
    .single();

  if (error) {
    console.error('[products.js createProduct] Error al crear producto:', error);
    throw new Error(`Error al crear producto: ${error.message}`);
  }

  return data;
}

/**
 * Actualiza un producto existente.
 *
 * @param {string} id - ID del producto
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Producto actualizado
 * @throws {Error} Si el producto no existe o hay error al actualizar
 *
 * @example
 * const updated = await updateProduct('123', {
 *   price: 1600000,
 *   stock: 15
 * });
 */
export async function updateProduct(id, updates) {
  // Sanitizar datos
  const sanitized = {};

  if (updates.name) sanitized.name = updates.name.trim();
  if (updates.description !== undefined) sanitized.description = updates.description?.trim() || '';
  if (updates.price !== undefined) sanitized.price = parseFloat(updates.price);
  if (updates.category !== undefined) sanitized.category = updates.category?.trim() || null;
  if (updates.image_url !== undefined) sanitized.image_url = updates.image_url?.trim() || null;
  if (updates.stock !== undefined) sanitized.stock = parseInt(updates.stock);

  const { data, error } = await supabase
    .from('products')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[products.js updateProduct] Error al actualizar producto:', id, error);
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }

  return data;
}

/**
 * Elimina un producto.
 *
 * @param {string} id - ID del producto
 * @returns {Promise<void>}
 * @throws {Error} Si hay error al eliminar
 *
 * @example
 * await deleteProduct('123');
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[products.js deleteProduct] Error al eliminar producto:', id, error);
    throw new Error(`Error al eliminar producto: ${error.message}`);
  }
}

/**
 * Obtiene productos de un vendedor específico.
 *
 * @param {string} sellerId - ID del vendedor
 * @param {number} [limit=50] - Límite de resultados
 * @returns {Promise<Array>} Productos del vendedor
 * @throws {Error} Si hay error en la consulta
 *
 * @example
 * const sellerProducts = await getProductsBySeller('seller-123');
 */
export async function getProductsBySeller(sellerId, limit = 50) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[products.js getProductsBySeller] Error:', error);
    throw new Error(`Error al obtener productos del vendedor: ${error.message}`);
  }

  return data;
}

/**
 * Obtiene productos por categoría.
 *
 * @param {string} category - Categoría
 * @param {number} [limit=20] - Límite de resultados
 * @returns {Promise<Array>} Productos de la categoría
 * @throws {Error} Si hay error en la consulta
 *
 * @example
 * const electronics = await getProductsByCategory('electronics');
 */
export async function getProductsByCategory(category, limit = 20) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[products.js getProductsByCategory] Error:', error);
    throw new Error(`Error al obtener productos por categoría: ${error.message}`);
  }

  return data;
}
