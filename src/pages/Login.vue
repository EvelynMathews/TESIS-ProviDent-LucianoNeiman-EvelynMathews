<script>
import { login } from '../services/auth'

export default {
    name: 'Login',
    data() {
        return {
            user: {
                email: '',
                password: '',
            },
            loading: false,
            errorMessage: '',
        }
    },
    methods: {
        async handleSubmit() {
            this.loading = true
            this.errorMessage = ''

            try {
                await login(this.user.email, this.user.password)
                this.$router.push('/mi-perfil')
            } catch (error) {
                this.errorMessage = 'Credenciales incorrectas o error al iniciar sesión.'
            } finally {
                this.loading = false
            }
        },
    },
}
</script>

<template>
    <section class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 pt-24">
        <div class="max-w-md w-full">
            <div class="text-center mb-8">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
                    style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                    <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">Bienvenido a ProviDent</h1>
                <p class="text-gray-600">Inicia sesión para continuar</p>
            </div>

            <div class="bg-white rounded-lg shadow-md p-8">
                <form @submit.prevent="handleSubmit" class="space-y-6">
                    <div>
                        <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                            Correo electrónico
                        </label>
                        <input type="email" id="email" v-model="user.email" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="tu@email.com" />
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input type="password" id="password" v-model="user.password" required minlength="6"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                            style="focus:ring-color: #2A6FAF;"
                            placeholder="••••••••" />
                    </div>

                    <div v-if="errorMessage"
                        class="p-4 rounded-lg bg-red-50 border border-red-200">
                        <p class="text-red-600 text-sm font-semibold">{{ errorMessage }}</p>
                    </div>

                    <button type="submit" :disabled="loading"
                        class="w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90 disabled:opacity-50"
                        style="background-color: #2A6FAF;">
                        {{ loading ? 'Ingresando...' : 'Ingresar' }}
                    </button>

                    <div class="text-center">
                        <a href="#" class="text-sm font-semibold hover:underline" style="color: #2A6FAF;">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </form>
            </div>

            <div class="mt-6 text-center">
                <p class="text-gray-600">
                    ¿No tenés cuenta?
                    <RouterLink to="/register" class="font-semibold hover:underline" style="color: #29A68C;">
                        Registrate gratis
                    </RouterLink>
                </p>
            </div>
        </div>
    </section>
</template>
