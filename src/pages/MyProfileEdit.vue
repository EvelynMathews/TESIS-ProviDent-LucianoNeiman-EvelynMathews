<script>
/**
 * Propósito: Vista para que el usuario edite su información personal y avatar.
 * Función: Permitir al usuario actualizar su nombre, apellido, biografía, ubicación y subir una nueva foto de perfil (avatar).
 * Cómo funciona: Se suscribe al estado de autenticación para precargar los datos actuales. `handleFileChange` actualiza la previsualización del avatar. `handleSubmit` gestiona la lógica clave: si hay un `avatarFile`, lo sube a Supabase Storage con un nombre único antes de llamar a `updateAuthUser` para guardar todos los cambios en la base de datos (tablas `users` y `user_profiles`).
 */
import { subscribeToAuthStateChanges, updateAuthUser } from '../services/auth'
import { supabase } from '../services/supabase'

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
            error: null
        }
    },
    methods: {
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
                this.$router.push('/mi-perfil')
            } catch (error) {
                console.error('Error al guardar:', error)
                alert('Error al guardar cambios. Verificá tu conexión o permisos.')
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
    <section class="pt-24 px-6 flex flex-col items-center min-h-screen pb-12" style="background-color: #F5FEFF;">
        <div class="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full border-2" style="border-color: #2A6FAF;">
            <h1 class="text-center mb-6 text-3xl font-heading font-bold flex items-center justify-center gap-2" style="color: #2A6FAF;">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Editar Perfil
            </h1>

            <form @submit.prevent="handleSubmit" class="flex flex-col gap-8">
                <div class="flex flex-col items-center relative">
                    <div
                        class="relative w-32 h-32 rounded-full overflow-hidden border-4 cursor-pointer group"
                        style="border-color: #29A68C;">
                        <img :src="avatarPreview || '/default-avatar.png'" alt="avatar preview" loading="lazy"
                            class="object-cover w-full h-full group-hover:opacity-70 transition" />
                        <input type="file" accept="image/*" @change="handleFileChange"
                            class="absolute inset-0 opacity-0 cursor-pointer" />
                        <div
                            class="absolute bottom-0 w-full text-white text-xs text-center py-1 opacity-0 group-hover:opacity-100 transition"
                            style="background-color: rgba(42, 111, 175, 0.9);">
                            Cambiar foto
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">Hacé clic en la foto para cambiarla</p>
                </div>

                <div class="border-2 rounded-lg p-6" style="border-color: #E3EEF8; background-color: #F9FCFE;">
                    <h3 class="font-heading text-xl font-bold mb-4" style="color: #2A6FAF;">Datos personales</h3>
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

                <div class="border-2 rounded-lg p-6" style="border-color: #E3EEF8; background-color: #F9FCFE;">
                    <h3 class="font-heading text-xl font-bold mb-4" style="color: #2A6FAF;">Información adicional</h3>
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
                    class="mt-4 px-6 py-3 rounded-lg text-white font-semibold shadow-md hover:opacity-90 transition text-lg"
                    style="background-color: #2A6FAF;">
                    {{ loading ? 'Guardando...' : 'Guardar cambios' }}
                </button>
            </form>

            <RouterLink to="/mi-perfil" class="block text-center mt-6 font-semibold hover:underline transition" style="color: #29A68C;">
                ← Volver al perfil
            </RouterLink>
        </div>
    </section>
</template>
