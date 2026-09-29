<script src="./product-edit.js"></script>

<template>
    <AdminLayout>
        <RouterLink to="/admin/products" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Volver a productos
        </RouterLink>

        <div v-if="loading" class="loading-spinner">
            <p>Cargando producto...</p>
        </div>

        <div v-else-if="loadError" class="alert alert-error">
            {{ loadError }}
        </div>

        <form v-else @submit.prevent="saveProduct">
            <div class="edit-header">
                <div>
                    <h1 class="edit-title">Editar producto</h1>
                    <p class="edit-subtitle">
                        <span class="product-type-badge" :class="product.product_type.toLowerCase()">{{ typeName }}</span>
                        Publicado por {{ product.seller.username }}
                    </p>
                </div>
            </div>

            <div v-if="saveSuccess" class="alert alert-success">
                Cambios guardados correctamente
            </div>
            <div v-if="saveError" class="alert alert-error">
                {{ saveError }}
            </div>

            <div class="edit-grid">
                <div class="form-card">
                    <h2 class="form-card-title">Imagen</h2>
                    <div class="image-preview">
                        <img v-if="imagePreview" :src="imagePreview" :alt="form.name" />
                        <div v-else class="image-empty">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
                                <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            <span>Sin imagen</span>
                        </div>
                    </div>
                    <label for="product-image" class="btn btn-secondary btn-block">
                        {{ imagePreview ? 'Cambiar imagen' : 'Subir imagen' }}
                    </label>
                    <input id="product-image" type="file" accept="image/*" class="file-input" @change="handleImageChange" />
                    <p v-if="imageFile" class="form-help-text">La imagen nueva se guarda al tocar "Guardar cambios"</p>
                </div>

                <div class="form-card">
                    <h2 class="form-card-title">Datos generales</h2>

                    <div class="form-group">
                        <label for="name" class="form-label">Nombre</label>
                        <input id="name" v-model="form.name" type="text" class="form-input" required />
                    </div>

                    <div class="form-group">
                        <label for="description" class="form-label">Descripción</label>
                        <textarea id="description" v-model="form.description" rows="4" class="form-input"
                            placeholder="Sin descripción"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="toggle">
                            <input v-model="form.is_active" type="checkbox" />
                            <span>Publicación activa</span>
                        </label>
                        <p class="form-help-text">Si está inactiva, no se muestra en el catálogo</p>
                    </div>
                </div>

                <div class="form-card form-card-wide">
                    <h2 class="form-card-title">Datos de {{ typeName.toLowerCase() }}</h2>

                    <div v-if="product.product_type === 'SUPPLY'" class="fields-grid">
                        <div class="form-group">
                            <label for="price" class="form-label">Precio ($)</label>
                            <input id="price" v-model="form.price" type="number" min="0" step="0.01" class="form-input" placeholder="Sin precio" />
                        </div>
                        <div class="form-group">
                            <label for="unit" class="form-label">Unidad</label>
                            <input id="unit" v-model="form.unit" type="text" class="form-input" placeholder="Ej: unidad, kg, caja" />
                        </div>
                        <div class="form-group">
                            <label for="stock" class="form-label">Stock</label>
                            <input id="stock" v-model="form.stock" type="number" min="0" class="form-input" placeholder="Sin stock cargado" />
                        </div>
                        <div class="form-group">
                            <label for="sku" class="form-label">SKU</label>
                            <input id="sku" v-model="form.sku" type="text" class="form-input" placeholder="Sin SKU" />
                        </div>
                    </div>

                    <div v-else-if="product.product_type === 'PROSTHESIS'">
                        <div class="fields-grid">
                            <div class="form-group">
                                <label for="material" class="form-label">Material</label>
                                <select id="material" v-model="form.material_id" class="form-input">
                                    <option value="">Sin material</option>
                                    <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="days" class="form-label">Días de fabricación</label>
                                <input id="days" v-model="form.manufacturing_days" type="number" min="0" class="form-input" placeholder="Sin dato" />
                            </div>
                        </div>

                        <p class="form-label">Precios por tipo de trabajo ($)</p>
                        <div class="table-scroll">
                            <table class="pricing-table">
                                <thead>
                                    <tr>
                                        <th>Trabajo</th>
                                        <th v-for="(label, group) in groupLabels" :key="group">{{ label }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(label, work) in workTypeLabels" :key="work">
                                        <td>{{ label }}</td>
                                        <td v-for="(groupLabel, group) in groupLabels" :key="group">
                                            <input v-model="form.pricingMatrix[work][group]" type="number" min="0" step="0.01"
                                                class="form-input" :aria-label="`${label} ${groupLabel}`" placeholder="-" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div v-else-if="product.product_type === 'PLASTER_SERVICE'" class="fields-grid">
                        <div class="form-group">
                            <label for="base-price" class="form-label">Precio base ($)</label>
                            <input id="base-price" v-model="form.base_price" type="number" min="0" step="0.01" class="form-input" placeholder="Sin precio" />
                        </div>
                        <div class="form-group">
                            <label for="plaster-days" class="form-label">Días de entrega</label>
                            <input id="plaster-days" v-model="form.manufacturing_days" type="number" min="0" class="form-input" placeholder="Sin dato" />
                        </div>
                    </div>

                    <div v-else-if="product.product_type === 'RENTAL'" class="fields-grid">
                        <div class="form-group">
                            <label for="rental-stock" class="form-label">Unidades disponibles</label>
                            <input id="rental-stock" v-model="form.stock" type="number" min="0" class="form-input" placeholder="Sin stock cargado" />
                        </div>
                        <div class="form-group">
                            <label for="price-day" class="form-label">Precio por día ($)</label>
                            <input id="price-day" v-model="form.priceDay" type="number" min="0" step="0.01" class="form-input" placeholder="Sin precio" />
                        </div>
                        <div class="form-group">
                            <label for="price-week" class="form-label">Precio por semana ($)</label>
                            <input id="price-week" v-model="form.priceWeek" type="number" min="0" step="0.01" class="form-input" placeholder="Sin precio" />
                        </div>
                        <div class="form-group">
                            <label for="price-month" class="form-label">Precio por mes ($)</label>
                            <input id="price-month" v-model="form.priceMonth" type="number" min="0" step="0.01" class="form-input" placeholder="Sin precio" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <RouterLink to="/admin/products" class="btn btn-secondary">Cancelar</RouterLink>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                    {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                </button>
            </div>
        </form>
    </AdminLayout>
</template>

<style src="./product-edit.css" scoped></style>
