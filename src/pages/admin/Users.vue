<script src="./users.js"></script>

<template>
    <AdminLayout>
        <div class="page-header">
            <div>
                <h1 class="page-title">Usuarios</h1>
                <p class="page-subtitle">Dá de alta o de baja usuarios y modificá sus datos</p>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-mini">
                <div class="stat-mini-label">Total</div>
                <div class="stat-mini-value">{{ stats.total }}</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-label">Activos</div>
                <div class="stat-mini-value">{{ stats.active }}</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-label">Dados de baja</div>
                <div class="stat-mini-value">{{ stats.inactive }}</div>
            </div>
        </div>

        <div class="filters-section">
            <div class="filter-group">
                <label for="users-search" class="filter-label">Buscar usuario</label>
                <input id="users-search" v-model="searchQuery" type="text" class="filter-input"
                    placeholder="Nombre, apellido o email..." />
            </div>
            <div class="filter-group">
                <label for="users-role" class="filter-label">Rol</label>
                <select id="users-role" v-model="filterRole" class="filter-input">
                    <option value="all">Todos</option>
                    <option value="BUYER">Compradores</option>
                    <option value="SELLER">Vendedores</option>
                    <option value="ADMIN">Admins</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="users-status" class="filter-label">Estado</label>
                <select id="users-status" v-model="filterStatus" class="filter-input">
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Dados de baja</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="loading-state">
            <p>Cargando usuarios...</p>
        </div>

        <div v-else-if="loadError" class="alert alert-error">
            {{ loadError }}
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <p>No se encontraron usuarios</p>
        </div>

        <div v-else class="table-container">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Roles</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Registrado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in filteredUsers" :key="user.id" :class="{ protected: isProtected(user) }">
                        <td>
                            <div class="user-name">{{ user.first_name }} {{ user.last_name }}</div>
                            <div class="user-email">{{ user.email || '-' }}</div>
                        </td>
                        <td>
                            <div class="role-list">
                                <span v-for="role in user.roles" :key="role" class="role-badge" :class="role.toLowerCase()">
                                    {{ roleLabels[role] || role }}
                                </span>
                            </div>
                        </td>
                        <td>{{ user.location || '-' }}</td>
                        <td>
                            <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                                {{ user.is_active ? 'Activo' : 'Dado de baja' }}
                            </span>
                        </td>
                        <td>{{ formatDate(user.created_at) }}</td>
                        <td>
                            <div v-if="isProtected(user)" class="action-buttons">
                                <button type="button" class="btn-icon locked" title="Cuenta protegida" aria-disabled="true"
                                    aria-label="Editar (cuenta protegida)" @click="showProtectedNotice(user)">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                                <button type="button" class="btn-icon locked" title="Cuenta protegida" aria-disabled="true"
                                    aria-label="Dar de baja (cuenta protegida)" @click="showProtectedNotice(user)">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M4.93 4.93l14.14 14.14" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                            </div>
                            <div v-else class="action-buttons">
                                <RouterLink :to="`/admin/users/${user.id}/edit`" class="btn-icon edit" title="Editar" aria-label="Editar">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </RouterLink>
                                <button type="button" class="btn-icon"
                                    :class="user.is_active ? 'deactivate' : 'activate'"
                                    :title="user.is_active ? 'Dar de baja' : 'Dar de alta'"
                                    :aria-label="user.is_active ? 'Dar de baja' : 'Dar de alta'"
                                    :disabled="busyId === user.id" @click="userToToggle = user">
                                    <svg v-if="user.is_active" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M4.93 4.93l14.14 14.14" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                    <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="userToToggle" class="modal-overlay" @click.self="userToToggle = null">
            <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="toggle-user-title">
                <h2 id="toggle-user-title" class="modal-title">
                    {{ userToToggle.is_active ? 'Dar de baja usuario' : 'Dar de alta usuario' }}
                </h2>
                <p v-if="userToToggle.is_active" class="modal-body">
                    ¿Dar de baja a {{ userToToggle.first_name }} {{ userToToggle.last_name }}? No va a poder iniciar sesión,
                    publicar ni comprar, y sus productos dejan de verse en el catálogo. Podés darlo de alta cuando quieras.
                </p>
                <p v-else class="modal-body">
                    ¿Dar de alta a {{ userToToggle.first_name }} {{ userToToggle.last_name }}? Va a poder volver a usar su cuenta
                    y sus productos activos vuelven a verse.
                </p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" @click="userToToggle = null">Cancelar</button>
                    <button type="button" class="btn" :class="userToToggle.is_active ? 'btn-danger' : 'btn-primary'"
                        :disabled="busyId === userToToggle.id" @click="confirmToggle">
                        {{ busyId === userToToggle.id ? 'Guardando...' : (userToToggle.is_active ? 'Dar de baja' : 'Dar de alta') }}
                    </button>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>

<style src="./users.css" scoped></style>
