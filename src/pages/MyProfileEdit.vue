<script>
/**
 * Propósito: Vista para que el usuario edite su información personal y avatar.
 * Función: Permitir al usuario actualizar su nombre, apellido, biografía, ubicación y subir una nueva foto de perfil (avatar).
 * Cómo funciona: Se suscribe al estado de autenticación para precargar los datos actuales. `handleFileChange` actualiza la previsualización del avatar. `handleSubmit` gestiona la lógica clave: si hay un `avatarFile`, lo sube a Supabase Storage con un nombre único antes de llamar a `updateAuthUser` para guardar todos los cambios en la base de datos (tablas `users` y `user_profiles`).
 */
import { subscribeToAuthStateChanges, updateAuthUser, changePassword } from '../services/auth'
import { supabase } from '../services/supabase'
import { clearCache } from '../services/cache'
import { showToast } from '../services/toast'

let unsubscribeFromAuth = () => { }

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
            loading: false,
            error: null,
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
            if (file) {
                this.avatarFile = file
                this.avatarPreview = URL.createObjectURL(file)
            }
        },

        async handleSubmit() {
            try {
                this.loading = true

                // Preparar datos a guardar
                const dataToUpdate = {
                    first_name: this.formData.first_name,
                    last_name: this.formData.last_name,
                    bio: this.formData.bio,
                    location: this.formData.location,
                }

                // Subir nuevo avatar si corresponde
                if (this.avatarFile) {
                    // El nombre debe estar en formato: {userId}/{timestamp}_{filename}
                    // para cumplir con las políticas de RLS del bucket
                    const fileName = `${this.userId}/${Date.now()}_${this.avatarFile.name}`
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, this.avatarFile, { cacheControl: '3600', upsert: false })

                    if (uploadError) throw uploadError

                    // Guardar la ruta del archivo (no la URL pública completa)
                    // porque MyProfile.vue usa createSignedUrl que necesita la ruta
                    dataToUpdate.avatar_url = fileName
                }

                await updateAuthUser(dataToUpdate)
                clearCache(`profile:${this.userId}`)
                showToast('Perfil actualizado correctamente')
                this.$router.push('/mi-perfil')
            } catch (error) {
                console.error('Error al guardar:', error)
                showToast('Error al guardar cambios. Verificá tu conexión o permisos.', 'error', 5000)
            } finally {
                this.loading = false
            }
        },
    },

    async mounted() {
        unsubscribeFromAuth = subscribeToAuthStateChanges(async (newUserState) => {
            this.userId = newUserState.id
            this.formData = {
                first_name: newUserState.first_name || '',
                last_name: newUserState.last_name || '',
                email: newUserState.email || '',
                bio: newUserState.bio || '',
                location: newUserState.location || '',
            }

            // Convertir ruta del avatar a URL pública para el preview
            if (newUserState.avatar_url) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(newUserState.avatar_url)
                this.avatarPreview = data.publicUrl
            } else {
                this.avatarPreview = ''
            }
        })
    },

    unmounted() {
        unsubscribeFromAuth()
    },
}
</script>

<template>
    <section class="pt-24 px-6 flex flex-col items-center min-h-screen pb-12 bg-surface">
        <div class="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full border-2 border-primary">
            <h1 class="text-center mb-6 text-3xl font-heading font-bold flex items-center justify-center gap-2 text-primary">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Editar Perfil
            </h1>

            <form @submit.prevent="handleSubmit" class="flex flex-col gap-8">
                <div class="flex flex-col items-center relative">
                    <div
                        class="relative w-32 h-32 rounded-full overflow-hidden border-4 cursor-pointer group border-secondary">
                        <img :src="avatarPreview || '/default-avatar.png'" alt="avatar preview" loading="lazy"
                            class="object-cover w-full h-full group-hover:opacity-70 transition" />
                        <input type="file" accept="image/*" @change="handleFileChange"
                            class="absolute inset-0 opacity-0 cursor-pointer" />
                        <div
                            class="absolute bottom-0 w-full text-white text-xs text-center py-1 opacity-0 group-hover:opacity-100 transition bg-primary/90">
                            Cambiar foto
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">Hacé clic en la foto para cambiarla</p>
                </div>

                <div class="border-2 rounded-lg p-6 border-primary-50 bg-surface-alt">
                    <h3 class="font-heading text-xl font-bold mb-4 text-primary">Datos personales</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                            <input v-model="formData.first_name" placeholder="Ingresá tu nombre"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                 />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                            <input v-model="formData.last_name" placeholder="Ingresá tu apellido"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                 />
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
                            <input v-model="formData.email" type="email" placeholder="correo@ejemplo.com" disabled
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                                 />
                            <p class="text-xs text-gray-500 mt-1">El email no puede modificarse</p>
                        </div>
                    </div>
                </div>

                <div class="border-2 rounded-lg p-6 border-primary-50 bg-surface-alt">
                    <h3 class="font-heading text-xl font-bold mb-4 text-primary">Información adicional</h3>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Biografía</label>
                            <textarea v-model="formData.bio" rows="4" placeholder="Contanos un poco sobre vos"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition resize-none"
                                ></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
                            <input v-model="formData.location" placeholder="Ciudad, Provincia"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                 />
                        </div>
                    </div>
                </div>

                <button type="submit"
                    class="mt-4 px-6 py-3 rounded-lg text-white font-semibold shadow-md hover:opacity-90 transition text-lg bg-primary">
                    {{ loading ? 'Guardando...' : 'Guardar cambios' }}
                </button>
            </form>

            <form id="cambiar-contrasena" @submit.prevent="handlePasswordChange"
                class="mt-8 border-2 border-primary-50 bg-surface-alt rounded-lg p-6 flex flex-col gap-4">
                <h3 class="font-heading text-xl font-bold text-primary">Cambiar contraseña</h3>

                <div v-if="passwordSuccess" class="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p class="text-green-700 text-sm font-semibold">Contraseña cambiada correctamente</p>
                </div>
                <div v-if="passwordError" class="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p class="text-red-600 text-sm font-semibold">{{ passwordError }}</p>
                </div>

                <div>
                    <label for="current-password" class="block text-sm font-semibold text-gray-700 mb-2">Contraseña actual</label>
                    <input id="current-password" v-model="passwordForm.currentPassword" type="password" required
                        autocomplete="current-password" placeholder="••••••••"
                        class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="new-password" class="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña</label>
                        <input id="new-password" v-model="passwordForm.newPassword" type="password" required
                            autocomplete="new-password" placeholder="••••••••"
                            class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition" />
                        <p class="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    </div>
                    <div>
                        <label for="confirm-password" class="block text-sm font-semibold text-gray-700 mb-2">Repetir nueva contraseña</label>
                        <input id="confirm-password" v-model="passwordForm.confirmPassword" type="password" required
                            autocomplete="new-password" placeholder="••••••••"
                            class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition" />
                    </div>
                </div>

                <button type="submit" :disabled="passwordLoading"
                    class="px-6 py-3 rounded-lg text-white font-semibold shadow-md bg-primary hover:opacity-90 transition disabled:opacity-50">
                    {{ passwordLoading ? 'Cambiando...' : 'Cambiar contraseña' }}
                </button>
            </form>

            <RouterLink to="/mi-perfil" class="block text-center mt-6 font-semibold hover:underline transition text-secondary">
                ← Volver al perfil
            </RouterLink>
        </div>
    </section>
</template>
