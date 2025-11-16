<script src="./dashboard.js"></script>

<template>
    <AdminLayout>
        <div class="dashboard-header">
            <h1 class="dashboard-title">Panel de Administración</h1>
            <p class="dashboard-subtitle">Resumen general de tu plataforma</p>
        </div>

        <div v-if="loading" class="loading-spinner">
            <p>Cargando datos...</p>
        </div>

        <div v-else>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Total Productos</span>
                        <div class="stat-icon products">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value">{{ stats.totalProducts }}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Total Usuarios</span>
                        <div class="stat-icon users">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value">{{ stats.totalUsers }}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-label">Productos Activos</span>
                        <div class="stat-icon active">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value">{{ stats.activeProducts }}</div>
                </div>
            </div>

            <div class="section-card">
                <div class="section-header">
                    <h2 class="section-title">Productos Recientes</h2>
                    <RouterLink to="/admin/products" class="view-all-link">Ver todos</RouterLink>
                </div>

                <div v-if="recentProducts.length === 0" class="empty-state">
                    <p>No hay productos registrados aún</p>
                </div>

                <table v-else class="products-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Tipo</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="product in recentProducts" :key="product.id">
                            <td class="product-name">{{ product.name }}</td>
                            <td>
                                <span class="product-type" :class="product.product_type.toLowerCase()">
                                    {{ getProductTypeName(product.product_type) }}
                                </span>
                            </td>
                            <td>{{ product.supply_products?.stock_qty ?? '-' }}</td>
                            <td>
                                <span class="status-badge" :class="product.is_active ? 'active' : 'inactive'">
                                    {{ product.is_active ? 'Activo' : 'Inactivo' }}
                                </span>
                            </td>
                            <td>{{ formatDate(product.created_at) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </AdminLayout>
</template>

<style src="./dashboard.css" scoped></style>
