<script>
/**
 * Propósito: Vista para que el usuario edite su información personal y avatar.
 * Función: Permitir al usuario actualizar su nombre, apellido, biografía, ubicación y subir una nueva foto de perfil (avatar).
 * Cómo funciona: Al montarse carga el perfil actual desde Supabase (`getUserProfileById`) para precargar el formulario.
 * `handleFileChange` valida el archivo (imagen de hasta 5 MB) y muestra la vista previa. `handleSubmit` sube el avatar
 * (si cambió) a Storage y llama a `updateAuthUser` para guardar los cambios en `users` y `user_profiles`.
 * `handlePasswordChange` cambia la contraseña verificando primero la actual (`changePassword`).
 */
import { updateAuthUser, changePassword } from '../services/auth'
import { showToast } from '../services/toast'
import { getUserProfileById } from '../services/user-profiles'
import { supabase } from '../services/supabase'
import { clearCache } from '../services/cache'

const MAX_AVATAR_MB = 5

export default {
    name: 'MyProfileEdit',
    data() {
        return {
            userId: null,
            formData: {
                first_name: '',
                last_name: '',
                email: '',
                bio: '',
                location: '',
            },
            avatarFile: null,
            avatarPreview: '',
            avatarError: '',
            loadingProfile: true,
            loading: false,
            error: '',
            touched: false,
            passwordForm: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            },
            passwordLoading: false,
            passwordSuccess: false,
            passwordError: '',
        }
    },
    computed: {
        nameError() {
            return this.touched && !this.formData.first_name.trim() ? 'El nombre no puede quedar vacío.' : ''
        },
        lastNameError() {
            return this.touched && !this.formData.last_name.trim() ? 'El apellido no puede quedar vacío.' : ''
        },
        initials() {
            return ((this.formData.first_name[0] || '') + (this.formData.last_name[0] || '')).toUpperCase() || '?'
        }
    },
    methods: {
        async handlePasswordChange() {
            this.passwordSuccess = false
            this.passwordError = ''
            try {
                this.passwordLoading = true
                const { currentPassword, newPassword, confirmPassword } = this.passwordForm
                await changePassword(currentPassword, newPassword, confirmPassword)
                this.passwordSuccess = true
                this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
            } catch (error) {
                this.passwordError = error.message
            } finally {
                this.passwordLoading = false
            }
        },
        handleFileChange(event) {
            const file = event.target.files[0]
            this.avatarError = ''
            if (!file) return
            if (!file.type.startsWith('image/')) {
                this.avatarError = 'Elegí un archivo de imagen (JPG, PNG o WebP).'
                event.target.value = ''
                return
            }
            if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
                this.avatarError = `La imagen pesa más de ${MAX_AVATAR_MB} MB. Probá con una más liviana.`
                event.target.value = ''
                return
            }
            this.avatarFile = file
            this.avatarPreview = URL.createObjectURL(file)
        },

        async handleSubmit() {
            this.touched = true
            this.error = ''
            if (this.nameError || this.lastNameError) return

            this.loading = true
            try {
                const dataToUpdate = {
                    first_name: this.formData.first_name.trim(),
                    last_name: this.formData.last_name.trim(),
                    bio: this.formData.bio.trim(),
                    location: this.formData.location.trim(),
                }

                if (this.avatarFile) {
                    // Formato {userId}/{timestamp}_{nombre} para cumplir las políticas RLS del bucket
                    const safeName = this.avatarFile.name.replace(/[^\w.-]+/g, '_')
                    const fileName = `${this.userId}/${Date.now()}_${safeName}`
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, this.avatarFile, { cacheControl: '3600', upsert: false })

                    if (uploadError) throw uploadError
                    dataToUpdate.avatar_url = fileName
                }

                await updateAuthUser(dataToUpdate)
                clearCache(`profile:${this.userId}`)
                showToast('Perfil actualizado correctamente')
                this.$router.push('/mi-perfil')
            } catch (error) {
                console.error('Error al guardar:', error)
                this.error = 'No pudimos guardar los cambios. Revisá tu conexión e intentá de nuevo.'
            } finally {
                this.loading = false
            }
        },
    },

    async mounted() {
        try {
            const { data } = await supabase.auth.getUser()
            this.userId = data?.user?.id || null
            if (!this.userId) return
            const profile = await getUserProfileById(this.userId)
            this.formData = {
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || '',
                email: profile?.email || data.user.email || '',
                bio: profile?.bio || '',
                location: profile?.location || '',
            }
            this.avatarPreview = profile?.avatar_url || ''
        } catch (e) {
            this.error = 'No pudimos cargar tus datos. Recargá la página para intentar de nuevo.'
        } finally {
            this.loadingProfile = false
        }
    },
}
</script>

<template>
    <section class="px-4 py-8 sm:py-10 flex flex-col items-center min-h-screen bg-surface">
        <div class="w-full max-w-2xl">
            <RouterLink to="/mi-perfil" class="inline-flex items-center gap-1 mb-4 text-sm font-semibold text-primary-700 hover:underline">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                Mi perfil
            </RouterLink>

            <div class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <h1 class="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Editar perfil</h1>

                <p v-if="loadingProfile" class="text-gray-600" role="status">Cargando tus datos…</p>

                <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-8" novalidate>
                    <div class="flex flex-col sm:flex-row items-center gap-5">
                        <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-100 bg-primary-50 flex-shrink-0">
                            <img v-if="avatarPreview" :src="avatarPreview" alt="Vista previa de tu foto" class="object-cover w-full h-full" @error="avatarPreview = ''" />
                            <span v-else class="w-full h-full flex items-center justify-center text-3xl font-bold text-primary" aria-hidden="true">{{ initials }}</span>
                        </div>
                        <div class="text-center sm:text-left">
                            <label for="avatar-input"
                                class="inline-flex items-center gap-2 h-11 px-4 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-primary">
                                Cambiar foto
                                <input id="avatar-input" type="file" accept="image/*" @change="handleFileChange" class="sr-only" aria-describedby="avatar-hint avatar-error" />
                            </label>
                            <p id="avatar-hint" class="field-hint">JPG, PNG o WebP, hasta 5 MB.</p>
                            <p v-if="avatarError" id="avatar-error" class="field-error" role="alert">{{ avatarError }}</p>
                        </div>
                    </div>

                    <fieldset class="space-y-4">
                        <legend class="font-heading text-lg font-bold text-gray-800 mb-3">Datos personales</legend>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="first-name" class="field-label">Nombre</label>
                                <input id="first-name" v-model="formData.first_name" autocomplete="given-name" class="field-input"
                                    :aria-invalid="!!nameError" aria-describedby="first-name-error" />
                                <p v-if="nameError" id="first-name-error" class="field-error">{{ nameError }}</p>
                            </div>
                            <div>
                                <label for="last-name" class="field-label">Apellido</label>
                                <input id="last-name" v-model="formData.last_name" autocomplete="family-name" class="field-input"
                                    :aria-invalid="!!lastNameError" aria-describedby="last-name-error" />
                                <p v-if="lastNameError" id="last-name-error" class="field-error">{{ lastNameError }}</p>
                            </div>
                            <div class="md:col-span-2">
                                <label for="email" class="field-label">Email</label>
                                <input id="email" :value="formData.email" type="email" readonly aria-describedby="email-hint"
                                    class="field-input bg-gray-100 text-gray-700" />
                                <p id="email-hint" class="field-hint">El email es tu usuario para ingresar. Para cambiarlo, escribinos desde Soporte.</p>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="space-y-4">
                        <legend class="font-heading text-lg font-bold text-gray-800 mb-3">Perfil público</legend>
                        <div>
                            <label for="bio" class="field-label">Sobre vos</label>
                            <textarea id="bio" v-model="formData.bio" rows="4" maxlength="500" class="field-input resize-y"
                                placeholder="Ej: Odontóloga en CABA, especializada en rehabilitación oral." aria-describedby="bio-hint"></textarea>
                            <p id="bio-hint" class="field-hint">Lo ven los compradores en tu perfil. {{ formData.bio.length }}/500</p>
                        </div>
                        <div>
                            <label for="location" class="field-label">Ubicación</label>
                            <input id="location" v-model="formData.location" autocomplete="address-level2" class="field-input" placeholder="Ciudad, provincia" />
                        </div>
                    </fieldset>

                    <p v-if="error" class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-semibold m-0" role="alert">{{ error }}</p>

                    <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <RouterLink to="/mi-perfil"
                            class="h-12 px-6 inline-flex items-center justify-center font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </RouterLink>
                        <button type="submit" :disabled="loading"
                            class="h-12 px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition disabled:opacity-60">
                            {{ loading ? 'Guardando…' : 'Guardar cambios' }}
                        </button>
                    </div>
                </form>
            </div>

            <form v-if="!loadingProfile" id="cambiar-contrasena" @submit.prevent="handlePasswordChange"
                class="mt-6 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col gap-4" novalidate>
                <h2 class="font-heading text-lg font-bold text-gray-800 m-0">Cambiar contraseña</h2>

                <p v-if="passwordSuccess" class="p-4 rounded-lg bg-secondary-50 border border-secondary-200 text-secondary-800 text-sm font-semibold m-0" role="status">
                    Contraseña cambiada correctamente
                </p>
                <p v-if="passwordError" class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-semibold m-0" role="alert">
                    {{ passwordError }}
                </p>

                <div>
                    <label for="current-password" class="field-label">Contraseña actual</label>
                    <input id="current-password" v-model="passwordForm.currentPassword" type="password" required
                        autocomplete="current-password" class="field-input" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="new-password" class="field-label">Nueva contraseña</label>
                        <input id="new-password" v-model="passwordForm.newPassword" type="password" required
                            autocomplete="new-password" class="field-input" aria-describedby="new-password-hint" />
                        <p id="new-password-hint" class="field-hint">Mínimo 6 caracteres.</p>
                    </div>
                    <div>
                        <label for="confirm-password" class="field-label">Repetí la nueva contraseña</label>
                        <input id="confirm-password" v-model="passwordForm.confirmPassword" type="password" required
                            autocomplete="new-password" class="field-input" />
                    </div>
                </div>

                <div class="flex sm:justify-end">
                    <button type="submit" :disabled="passwordLoading"
                        class="w-full sm:w-auto h-12 px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition disabled:opacity-60">
                        {{ passwordLoading ? 'Cambiando…' : 'Cambiar contraseña' }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>
