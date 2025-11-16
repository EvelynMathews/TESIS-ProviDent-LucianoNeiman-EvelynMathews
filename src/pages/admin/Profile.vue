<script src="./profile.js"></script>

<template>
    <AdminLayout>
        <div class="profile-header">
            <h1 class="profile-title">Perfil de Administrador</h1>
        </div>

        <div class="stats-section">
            <h2 class="stats-title">Estadísticas de Administración</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-box-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="stat-box-label">Productos Gestionados</div>
                    <div class="stat-box-value">{{ stats.totalProducts }}</div>
                </div>

                <div class="stat-box">
                    <div class="stat-box-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2"/>
                            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="stat-box-label">Productos Activos</div>
                    <div class="stat-box-value">{{ stats.activeProducts }}</div>
                </div>

                <div class="stat-box">
                    <div class="stat-box-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="stat-box-label">Último Acceso</div>
                    <div class="stat-box-value" style="font-size: 0.875rem;">{{ formatDate(stats.lastAccess) }}</div>
                </div>
            </div>
        </div>

        <div class="forms-container">
            <div class="form-card">
                <h2 class="form-card-title">Información Personal</h2>

                <div v-if="profileSuccess" class="alert alert-success">
                    Perfil actualizado correctamente
                </div>
                <div v-if="profileError" class="alert alert-error">
                    {{ profileError }}
                </div>

                <form @submit.prevent="updateProfile">
                    <div class="form-group">
                        <label class="form-label">Nombre</label>
                        <input
                            v-model="profileForm.first_name"
                            type="text"
                            class="form-input"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Apellido</label>
                        <input
                            v-model="profileForm.last_name"
                            type="text"
                            class="form-input"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input
                            v-model="profileForm.email"
                            type="email"
                            class="form-input"
                            disabled
                        />
                        <p class="form-help-text">El email no se puede modificar</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Rol</label>
                        <input
                            value="Administrador"
                            type="text"
                            class="form-input"
                            disabled
                        />
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
                        </button>
                    </div>
                </form>
            </div>

            <div class="form-card">
                <h2 class="form-card-title">Cambiar Contraseña</h2>

                <div v-if="passwordSuccess" class="alert alert-success">
                    Contraseña cambiada correctamente
                </div>
                <div v-if="passwordError" class="alert alert-error">
                    {{ passwordError }}
                </div>

                <form @submit.prevent="changePassword">
                    <div class="form-group">
                        <label class="form-label">Contraseña Actual</label>
                        <input
                            v-model="passwordForm.currentPassword"
                            type="password"
                            class="form-input"
                            placeholder="Ingrese su contraseña actual"
                        />
                        <p class="form-help-text">Por seguridad, ingrese su contraseña actual</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Nueva Contraseña</label>
                        <input
                            v-model="passwordForm.newPassword"
                            type="password"
                            class="form-input"
                            placeholder="Ingrese la nueva contraseña"
                            required
                        />
                        <p class="form-help-text">La contraseña debe tener al menos 6 caracteres</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Confirmar Nueva Contraseña</label>
                        <input
                            v-model="passwordForm.confirmPassword"
                            type="password"
                            class="form-input"
                            placeholder="Confirme la nueva contraseña"
                            required
                        />
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            {{ loading ? 'Cambiando...' : 'Cambiar Contraseña' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </AdminLayout>
</template>

<style src="./profile.css" scoped></style>
