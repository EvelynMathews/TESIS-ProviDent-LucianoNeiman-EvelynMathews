<script src="./products.js"></script>

<template>
    <AdminLayout>
        <div class="products-header">
            <h1 class="products-title">Productos</h1>
            <p class="products-subtitle">Gestiona el catálogo completo de productos</p>
        </div>

        <div class="products-stats">
            <div class="stat-mini">
                <div class="stat-mini-label">Total</div>
                <div class="stat-mini-value">{{ productStats.total }}</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-label">Activos</div>
                <div class="stat-mini-value">{{ productStats.active }}</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-label">Inactivos</div>
                <div class="stat-mini-value">{{ productStats.inactive }}</div>
            </div>
        </div>

        <div class="filters-section">
            <div class="filters-grid">
                <div class="filter-group">
                    <label class="filter-label">Buscar producto</label>
                    <input
                        v-model="searchQuery"
                        type="text"
                        class="filter-input"
                        placeholder="Nombre, descripción o SKU..."
                    />
                </div>

                <div class="filter-group">
                    <label class="filter-label">Tipo</label>
                    <select v-model="filterType" class="filter-select">
                        <option value="all">Todos</option>
                        <option value="SUPPLY">Insumo</option>
                        <option value="PROSTHESIS">Prótesis</option>
                        <option value="PLASTER_SERVICE">Servicio de Yeso</option>
                        <option value="RENTAL">Alquiler</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label">Estado</label>
                    <select v-model="filterStatus" class="filter-select">
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading-spinner">
            <p>Cargando productos...</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="empty-state">
            <p>No se encontraron productos</p>
        </div>

        <div v-else class="products-table-container">
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="product in filteredProducts" :key="product.id">
                        <td>
                            <div class="product-name-cell">{{ product.name }}</div>
                            <div v-if="product.description" class="product-description">
                                {{ product.description }}
                            </div>
                        </td>
                        <td>
                            <span class="product-type-badge" :class="product.product_type.toLowerCase()">
                                {{ getProductTypeName(product.product_type) }}
                            </span>
                        </td>
                        <td>{{ getProductPrice(product) }}</td>
                        <td>{{ getProductStock(product) }}</td>
                        <td>
                            <span class="status-badge" :class="product.is_active ? 'active' : 'inactive'">
                                {{ product.is_active ? 'Activo' : 'Inactivo' }}
                            </span>
                        </td>
                        <td>{{ formatDate(product.created_at) }}</td>
                        <td>
                            <div class="action-buttons">
                                <button
                                    @click="toggleProductStatus(product)"
                                    class="btn-icon toggle"
                                    :title="product.is_active ? 'Desactivar' : 'Activar'"
                                >
                                    <svg v-if="product.is_active" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                    <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2"/>
                                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                                <button
                                    @click="confirmDelete(product)"
                                    class="btn-icon delete"
                                    title="Eliminar"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
            <div class="modal-content" @click.stop>
                <h2 class="modal-title">Confirmar eliminación</h2>
                <div class="modal-body">
                    ¿Estás seguro que deseas eliminar el producto "{{ productToDelete?.name }}"?
                    Esta acción no se puede deshacer.
                </div>
                <div class="modal-actions">
                    <button @click="cancelDelete" class="btn btn-secondary">Cancelar</button>
                    <button @click="deleteProduct" class="btn btn-danger">Eliminar</button>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>

<style src="./products.css" scoped></style>
