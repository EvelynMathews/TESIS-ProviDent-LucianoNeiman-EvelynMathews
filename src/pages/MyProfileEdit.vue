<script>
import { getCurrentUser } from '../services/auth'
import { getUserProfileById, updateUserProfile } from '../services/user-profiles'
import { supabase } from '../services/supabase'

export default {
    name: 'MyProfileEdit',
    data() {
        return {
            formData: {
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                bio: '',
                avatar_url: '',
                location: '',
            },
            addressData: {
                street: '',
                city: '',
                province: '',
                postal_code: '',
                country: 'Argentina',
            },
            avatarFile: null,
            avatarPreview: '',
            loading: false,
            loadingData: true,
        }
    },
    methods: {
        async loadProfile() {
            try {
                this.loadingData = true
                const currentUser = getCurrentUser()

                if (!currentUser.id) {
                    this.$router.push('/login')
                    return
                }

                const profile = await getUserProfileById(currentUser.id)

                this.formData = {
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    bio: profile.bio || '',
                    avatar_url: profile.avatar_url || '',
                    location: profile.location || '',
                }

                this.avatarPreview = profile.avatar_url || ''

                // Parsear location
                if (profile.location) {
                    const [city, province] = profile.location.split(', ')
                    this.addressData.city = city || ''
                    this.addressData.province = province || ''
                }
            } catch (error) {
                console.error('[MyProfileEdit] Error al cargar perfil:', error)
                alert('Error al cargar el perfil')
            } finally {
                this.loadingData = false
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
                const currentUser = getCurrentUser()

                // Subir nuevo avatar si corresponde
                if (this.avatarFile) {
                    const fileName = `${currentUser.id}_${Date.now()}_${this.avatarFile.name}`
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, this.avatarFile, { cacheControl: '3600', upsert: false })

                    if (uploadError) throw uploadError

                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
                    this.formData.avatar_url = urlData.publicUrl
                }

                // Actualizar users (first_name, last_name)
                await supabase
                    .from('users')
                    .update({
                        first_name: this.formData.first_name,
                        last_name: this.formData.last_name
                    })
                    .eq('id', currentUser.id)

                // Actualizar user_profiles
                const location = this.addressData.city && this.addressData.province
                    ? `${this.addressData.city}, ${this.addressData.province}`
                    : ''

                await updateUserProfile(currentUser.id, {
                    avatar_url: this.formData.avatar_url,
                    bio: this.formData.bio,
                    location: location
                })

                alert('Perfil actualizado correctamente')
                this.$router.push('/mi-perfil')
            } catch (error) {
                console.error('[MyProfileEdit] Error al guardar:', error)
                alert('Error al guardar cambios.')
            } finally {
                this.loading = false
            }
        },
    },

    mounted() {
        this.loadProfile()
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
                                style="focus:border-color: #2A6FAF;" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                            <input v-model="formData.last_name" placeholder="Ingresá tu apellido"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #2A6FAF;" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
                            <input v-model="formData.email" type="email" placeholder="correo@ejemplo.com"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #2A6FAF;" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                            <input v-model="formData.phone" placeholder="+54 11 1234-5678"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #2A6FAF;" />
                        </div>
                    </div>
                </div>

                <div class="border-2 rounded-lg p-6" style="border-color: #D4F4EC; background-color: #F8FDFB;">
                    <h3 class="font-heading text-xl font-bold mb-4" style="color: #29A68C;">Domicilio</h3>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Calle y número</label>
                            <input v-model="addressData.street" placeholder="Av. Corrientes 1234"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #29A68C;" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Ciudad</label>
                                <input v-model="addressData.city" placeholder="CABA"
                                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                    style="focus:border-color: #29A68C;" />
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Provincia</label>
                                <input v-model="addressData.province" placeholder="Buenos Aires"
                                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                    style="focus:border-color: #29A68C;" />
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Código postal</label>
                                <input v-model="addressData.postal_code" placeholder="C1043"
                                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                    style="focus:border-color: #29A68C;" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="border-2 rounded-lg p-6" style="border-color: #F8E8E2; background-color: #FEFAF8;">
                    <h3 class="font-heading text-xl font-bold mb-4" style="color: #DC8C73;">Información bancaria</h3>
                    <div class="grid grid-cols-1 gap-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Banco</label>
                                <input v-model="bankData.bank_name" placeholder="Banco Galicia"
                                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                    style="focus:border-color: #DC8C73;" />
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Titular de la cuenta</label>
                                <input v-model="bankData.account_holder" placeholder="Nombre completo del titular"
                                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                    style="focus:border-color: #DC8C73;" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">CBU</label>
                            <input v-model="bankData.cbu" placeholder="0070123430000005678901"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #DC8C73;" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Alias</label>
                            <input v-model="bankData.alias" placeholder="nombre.apellido.dental"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #DC8C73;" />
                        </div>
                    </div>
                </div>

                <div class="border-2 rounded-lg p-6" style="border-color: #E3EEF8; background-color: #F9FCFE;">
                    <h3 class="font-heading text-xl font-bold mb-4" style="color: #2A6FAF;">Información adicional</h3>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de usuario</label>
                            <input v-model="formData.username" placeholder="Ingresá tu nombre de usuario"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #2A6FAF;" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Biografía</label>
                            <textarea v-model="formData.bio" rows="4" placeholder="Contanos un poco sobre vos"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition resize-none"
                                style="focus:border-color: #2A6FAF;"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Especialidades</label>
                            <input v-model="formData.favorite_genres" placeholder="Ej: Endodoncia, Ortodoncia"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #2A6FAF;" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
                            <input v-model="formData.location" placeholder="Ciudad, Provincia"
                                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary transition"
                                style="focus:border-color: #2A6FAF;" />
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
