<script src="./user-edit.js"></script>

<template>
    <AdminLayout>
        <RouterLink to="/admin/users" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Volver a usuarios
        </RouterLink>

        <div v-if="loading" class="loading-spinner">
            <p>Cargando usuario...</p>
        </div>

        <div v-else-if="loadError" class="alert alert-error">
            {{ loadError }}
        </div>

        <form v-else @submit.prevent="saveUser" novalidate>
            <div class="edit-header">
                <h1 class="edit-title">Editar usuario</h1>
                <p class="edit-subtitle">{{ user.first_name }} {{ user.last_name }} · {{ rolesText }}</p>
            </div>

            <div v-if="saveError" class="alert alert-error">
                {{ saveError }}
            </div>

            <div class="edit-grid">
                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Datos de la cuenta</h2>
                    <div class="fields-grid">
                        <div class="form-group">
                            <label for="user-first-name" class="form-label">Nombre *</label>
                            <input id="user-first-name" v-model="form.first_name" type="text" class="form-input" required />
                        </div>
                        <div class="form-group">
                            <label for="user-last-name" class="form-label">Apellido *</label>
                            <input id="user-last-name" v-model="form.last_name" type="text" class="form-input" required />
                        </div>
                        <div class="form-group">
                            <label for="user-email" class="form-label">Email</label>
                            <input id="user-email" :value="user.email" type="email" class="form-input" disabled />
                            <p class="form-help-text">Es el usuario de inicio de sesión, no se modifica desde acá</p>
                        </div>
                        <div class="form-group">
                            <label for="user-roles" class="form-label">Roles</label>
                            <input id="user-roles" :value="rolesText" type="text" class="form-input" disabled />
                        </div>
                    </div>
                </div>

                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Perfil público</h2>
                    <div class="form-group">
                        <label for="user-bio" class="form-label">Biografía</label>
                        <textarea id="user-bio" v-model="form.bio" rows="3" class="form-input" placeholder="Sin biografía"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="user-location" class="form-label">Ubicación</label>
                        <input id="user-location" v-model="form.location" type="text" class="form-input" placeholder="Sin ubicación" />
                    </div>
                </div>

                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Estado de la cuenta</h2>
                    <div class="form-group">
                        <label class="toggle">
                            <input v-model="form.is_active" type="checkbox" :disabled="isCurrentUser" />
                            <span>Cuenta activa</span>
                        </label>
                        <p v-if="isCurrentUser" class="form-help-text">No podés darte de baja a vos mismo</p>
                        <p v-else class="form-help-text">
                            Si la desactivás, el usuario no puede iniciar sesión, publicar ni comprar, y sus productos dejan de verse
                        </p>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <RouterLink to="/admin/users" class="btn btn-secondary">Cancelar</RouterLink>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                    {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                </button>
            </div>
        </form>
    </AdminLayout>
</template>

<style src="./product-edit.css" scoped></style>
