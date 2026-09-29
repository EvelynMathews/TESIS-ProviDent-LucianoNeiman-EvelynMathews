<script src="./classified-edit.js"></script>

<template>
    <AdminLayout>
        <RouterLink to="/admin/classifieds" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Volver a anuncios
        </RouterLink>

        <div v-if="loading" class="loading-spinner">
            <p>Cargando anuncio...</p>
        </div>

        <div v-else-if="loadError" class="alert alert-error">
            {{ loadError }}
        </div>

        <form v-else @submit.prevent="saveAd" novalidate>
            <div class="edit-header">
                <h1 class="edit-title">{{ adId ? 'Editar anuncio' : 'Nuevo anuncio' }}</h1>
                <p class="edit-subtitle">Los campos con * son obligatorios</p>
            </div>

            <div v-if="saveError" class="alert alert-error">
                {{ saveError }}
            </div>

            <div class="edit-grid">
                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Puesto</h2>
                    <div class="fields-grid">
                        <div class="form-group">
                            <label for="ad-title" class="form-label">Puesto *</label>
                            <input id="ad-title" v-model="form.title" type="text" class="form-input" placeholder="Ej: Asistente dental" required />
                        </div>
                        <div class="form-group">
                            <label for="ad-company" class="form-label">Empresa o consultorio *</label>
                            <input id="ad-company" v-model="form.company" type="text" class="form-input" placeholder="Ej: Clínica Dental Sonrisas" required />
                        </div>
                        <div class="form-group">
                            <label for="ad-location" class="form-label">Ubicación</label>
                            <input id="ad-location" v-model="form.location" type="text" class="form-input" placeholder="Ej: Palermo, CABA" />
                        </div>
                        <div class="form-group">
                            <label for="ad-type" class="form-label">Jornada *</label>
                            <select id="ad-type" v-model="form.job_type" class="form-input" required>
                                <option value="" disabled>Seleccioná</option>
                                <option v-for="type in jobTypes" :key="type" :value="type">{{ type }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Detalle del aviso</h2>
                    <div class="form-group">
                        <label for="ad-summary" class="form-label">Resumen *</label>
                        <input id="ad-summary" v-model="form.summary" type="text" class="form-input" maxlength="140"
                            placeholder="Una línea que se muestra en la tarjeta del Home" required />
                        <p class="form-help-text">{{ form.summary.length }}/140 caracteres</p>
                    </div>
                    <div class="form-group">
                        <label for="ad-description" class="form-label">Descripción del puesto *</label>
                        <textarea id="ad-description" v-model="form.description" rows="4" class="form-input"
                            placeholder="Tareas, horarios, qué se ofrece..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="ad-requirements" class="form-label">Requisitos</label>
                        <textarea id="ad-requirements" v-model="form.requirements" rows="3" class="form-input"
                            placeholder="Títulos, experiencia, matrícula..."></textarea>
                    </div>
                </div>

                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Contacto y publicación</h2>
                    <div class="fields-grid">
                        <div class="form-group">
                            <label for="ad-email" class="form-label">Email para postularse *</label>
                            <input id="ad-email" v-model="form.contact_email" type="email" class="form-input" placeholder="rrhh@empresa.com" required />
                        </div>
                        <div class="form-group">
                            <label for="ad-date" class="form-label">Fecha de publicación *</label>
                            <input id="ad-date" v-model="form.published_at" type="date" class="form-input" required />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="toggle">
                            <input v-model="form.is_active" type="checkbox" />
                            <span>Mostrar en Clasificados</span>
                        </label>
                        <p class="form-help-text">Si está desactivado, el anuncio queda guardado pero no se ve en el Home</p>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <RouterLink to="/admin/classifieds" class="btn btn-secondary">Cancelar</RouterLink>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                    {{ saving ? 'Guardando...' : (adId ? 'Guardar cambios' : 'Crear anuncio') }}
                </button>
            </div>
        </form>
    </AdminLayout>
</template>

<style src="./product-edit.css" scoped></style>
