<script>
/**
 * Propósito: Vista para que los usuarios inicien sesión en la aplicación.
 * Función: Autenticar al usuario enviando sus credenciales (email y contraseña) al servicio de autenticación.
 * Cómo funciona: Captura el `email` y `password` del formulario y llama a la función `login` de `auth.js`.
 * Si el proceso es exitoso, vuelve a la página que el usuario quería visitar (`?redirect=`) o a su perfil.
 * Los errores de Supabase se traducen a mensajes claros (`translateAuthError`).
 * "¿La olvidaste?" abre un modal que indica cómo pedir una contraseña nueva a soporte.
 */
import { login, translateAuthError } from '../services/auth'
import ForgotPasswordModal from '../components/ForgotPasswordModal.vue'

export default {
    name: 'Login',
    components: { ForgotPasswordModal },
    data() {
        return {
            user: {
                email: '',
                password: '',
            },
            showPassword: false,
            loading: false,
            errorMessage: '',
            showForgotPassword: false,
        }
    },
    computed: {
        redirectTo() {
            const r = this.$route.query.redirect
            // Solo rutas internas, para evitar redirecciones a sitios externos
            return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/mi-perfil'
        },
        cameFromProtectedPage() {
            return !!this.$route.query.redirect
        }
    },
    methods: {
        async handleSubmit() {
            this.loading = true
            this.errorMessage = ''

            try {
                await login(this.user.email.trim(), this.user.password)
                this.$router.replace(this.redirectTo)
            } catch (error) {
                this.errorMessage = translateAuthError(error?.message)
                this.$nextTick(() => this.$refs.errorBox?.focus())
            } finally {
                this.loading = false
            }
        },

    },
}
</script>

<template>
    <section class="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4">
        <div class="max-w-md w-full">
            <div class="text-center mb-8">
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">Iniciá sesión</h1>
                <p class="text-gray-600 m-0">
                    {{ cameFromProtectedPage ? 'Necesitás una cuenta para continuar.' : 'Bienvenido de nuevo a ProviDent.' }}
                </p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 shadow-[0_12px_32px_-16px_rgba(18,45,70,0.25)] p-6 sm:p-8">
                <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
                    <div>
                        <label for="email" class="field-label">Email</label>
                        <input type="email" id="email" v-model="user.email" required autocomplete="email" inputmode="email"
                            class="field-input" placeholder="tu@email.com"
                            :aria-invalid="!!errorMessage" aria-describedby="login-error" />
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label for="password" class="block text-sm font-semibold text-gray-700">Contraseña</label>
                            <button type="button" @click="showForgotPassword = true"
                                class="text-sm font-semibold text-primary-700 hover:underline underline-offset-4">
                                ¿La olvidaste?
                            </button>
                        </div>
                        <div class="relative">
                            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="user.password" required
                                autocomplete="current-password" class="field-input pr-12"
                                :aria-invalid="!!errorMessage" aria-describedby="login-error" />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" :aria-pressed="showPassword">
                                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div v-if="errorMessage" id="login-error" ref="errorBox" tabindex="-1" role="alert"
                        class="p-4 rounded-lg bg-red-50 border border-red-200 outline-none">
                        <p class="text-red-800 text-sm font-semibold m-0">{{ errorMessage }}</p>
                    </div>

                    <button type="submit" :disabled="loading || !user.email || !user.password"
                        class="w-full h-12 px-4 bg-primary text-white font-semibold rounded-lg transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ loading ? 'Ingresando…' : 'Ingresar' }}
                    </button>
                </form>

            </div>

            <p class="mt-6 text-center text-gray-600">
                ¿No tenés cuenta?
                <RouterLink :to="{ path: '/register', query: $route.query.redirect ? { redirect: $route.query.redirect } : {} }"
                    class="font-semibold text-secondary-700 hover:underline underline-offset-4">
                    Creala gratis
                </RouterLink>
            </p>
        </div>

        <ForgotPasswordModal v-if="showForgotPassword"
            message="Por seguridad no guardamos tu contraseña. Escribinos desde el email con el que te registraste y te asignamos una nueva."
            @close="showForgotPassword = false" />
    </section>
</template>
