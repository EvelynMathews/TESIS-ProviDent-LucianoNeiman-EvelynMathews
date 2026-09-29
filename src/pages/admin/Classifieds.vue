<script src="./classifieds.js"></script>

<template>
    <AdminLayout>
        <div class="page-header">
            <div>
                <h1 class="page-title">Anuncios de empleo</h1>
                <p class="page-subtitle">Gestioná los avisos de la sección Clasificados del Home</p>
            </div>
            <RouterLink to="/admin/classifieds/new" class="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Nuevo anuncio
            </RouterLink>
        </div>

        <div class="stats-row">
            <div class="stat-mini">
                <div class="stat-mini-label">Total</div>
                <div class="stat-mini-value">{{ stats.total }}</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-label">Publicados</div>
                <div class="stat-mini-value">{{ stats.active }}</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-label">Ocultos</div>
                <div class="stat-mini-value">{{ stats.inactive }}</div>
            </div>
        </div>

        <div class="filters-section">
            <div class="filter-group filter-search">
                <label for="ads-search" class="filter-label">Buscar anuncio</label>
                <input id="ads-search" v-model="searchQuery" type="text" class="filter-input"
                    placeholder="Puesto, empresa o ubicación..." />
            </div>
            <div class="filter-group">
                <label for="ads-status" class="filter-label">Estado</label>
                <select id="ads-status" v-model="filterStatus" class="filter-input">
                    <option value="all">Todos</option>
                    <option value="active">Publicados</option>
                    <option value="inactive">Ocultos</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="loading-state">
            <p>Cargando anuncios...</p>
        </div>

        <div v-else-if="loadError" class="alert alert-error">
            {{ loadError }}
        </div>

        <div v-else-if="filteredAds.length === 0" class="empty-state">
            <p>No se encontraron anuncios</p>
        </div>

        <div v-else class="table-container">
            <table class="ads-table">
                <thead>
                    <tr>
                        <th>Puesto</th>
                        <th>Jornada</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Publicado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="ad in filteredAds" :key="ad.id">
                        <td>
                            <div class="ad-title">{{ ad.title }}</div>
                            <div class="ad-company">{{ ad.company }}</div>
                        </td>
                        <td>{{ ad.job_type || '-' }}</td>
                        <td>{{ ad.location || '-' }}</td>
                        <td>
                            <span class="status-badge" :class="ad.is_active ? 'active' : 'inactive'">
                                {{ ad.is_active ? 'Publicado' : 'Oculto' }}
                            </span>
                        </td>
                        <td>{{ formatDate(ad.published_at) }}</td>
                        <td>
                            <div class="action-buttons">
                                <button type="button" class="btn-icon view" title="Ver" aria-label="Ver" @click="adToView = ad">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
                                        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                                <RouterLink :to="`/admin/classifieds/${ad.id}/edit`" class="btn-icon edit" title="Editar" aria-label="Editar">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </RouterLink>
                                <button type="button" class="btn-icon toggle" :disabled="busyId === ad.id"
                                    :title="ad.is_active ? 'Ocultar' : 'Publicar'" :aria-label="ad.is_active ? 'Ocultar' : 'Publicar'"
                                    @click="toggleActive(ad)">
                                    <svg v-if="ad.is_active" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                    <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2"/>
                                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                                <button type="button" class="btn-icon delete" title="Eliminar" aria-label="Eliminar"
                                    :disabled="busyId === ad.id" @click="adToDelete = ad">
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

        <ClassifiedModal v-if="adToView" :ad="adToView" @close="adToView = null" />

        <div v-if="adToDelete" class="modal-overlay" @click.self="adToDelete = null">
            <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="delete-ad-title">
                <h2 id="delete-ad-title" class="modal-title">Confirmar eliminación</h2>
                <p class="modal-body">
                    ¿Estás seguro que deseas eliminar el anuncio “{{ adToDelete.title }}”?
                    Esta acción no se puede deshacer.
                </p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" @click="adToDelete = null">Cancelar</button>
                    <button type="button" class="btn btn-danger" :disabled="busyId === adToDelete.id" @click="deleteAd">
                        {{ busyId === adToDelete.id ? 'Eliminando...' : 'Eliminar' }}
                    </button>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>

<style src="./classifieds.css" scoped></style>
