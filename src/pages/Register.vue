<script>
/**
 * Propósito: Vista de registro de nuevos usuarios.
 * Función: Recoger los datos mínimos (nombre, apellido, email y contraseña) y crear la cuenta.
 * Cómo funciona: Un único formulario corto con validación en línea. Llama a `register` de `auth.js`.
 * Si Supabase requiere confirmar el email, muestra instrucciones claras; si no, entra directo.
 * Los errores se traducen a mensajes en español (`translateAuthError`).
 */
import { register, translateAuthError } from '../services/auth'

export default {
    name: 'Register',
    data() {
        return {
            user: {
                name: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
            },
            touched: {},
            showPassword: false,
            loading: false,
            errorMessage: '',
            registrationSuccess: false,
        }
    },
    computed: {
        errors() {
            const e = {}
            if (!this.user.name.trim()) e.name = 'Ingresá tu nombre.'
            if (!this.user.lastName.trim()) e.lastName = 'Ingresá tu apellido.'
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.user.email.trim())) e.email = 'Ingresá un email válido, por ejemplo nombre@consultorio.com.'
            if (this.user.password.length < 6) e.password = 'Usá al menos 6 caracteres.'
            if (this.user.confirmPassword !== this.user.password) e.confirmPassword = 'Las contraseñas no coinciden.'
            return e
        },
        isValid() {
            return Object.keys(this.errors).length === 0
        },
        redirectQuery() {
            return this.$route.query.redirect ? { redirect: this.$route.query.redirect } : {}
        }
    },
    methods: {
        showError(field) {
            return this.touched[field] && this.errors[field]
        },
        touch(field) {
            this.touched = { ...this.touched, [field]: true }
        },
        async handleSubmit() {
            this.touched = { name: true, lastName: true, email: true, password: true, confirmPassword: true }
            if (!this.isValid) {
                const first = ['name', 'lastName', 'email', 'password', 'confirmPassword'].find(f => this.errors[f])
                document.getElementById(first)?.focus()
                return
            }

            this.loading = true
            this.errorMessage = ''

            try {
                const result = await register(this.user.email.trim(), this.user.password, {
                    name: this.user.name.trim(),
                    lastName: this.user.lastName.trim()
                })

                if (result.requiresEmailConfirmation) {
                    this.registrationSuccess = true
                    window.scrollTo({ top: 0 })
                } else {
                    const r = this.$route.query.redirect
                    this.$router.replace(typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/mi-perfil')
                }
            } catch (error) {
                this.errorMessage = translateAuthError(error?.message)
            } finally {
                this.loading = false
            }
        }
    },
}
</script>

<template>
    <section class="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4">
        <div class="max-w-lg w-full">
            <!-- Cuenta creada: falta confirmar el email -->
            <div v-if="registrationSuccess" class="bg-white rounded-2xl border border-gray-200 shadow-[0_12px_32px_-16px_rgba(18,45,70,0.25)] p-8 text-center" role="status">
                <div class="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-secondary-50 text-secondary-700" aria-hidden="true">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 class="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Revisá tu email</h1>
                <p class="text-gray-600 mb-1">Te enviamos un enlace de confirmación a</p>
                <p class="text-lg font-semibold text-primary-700 mb-6 break-all">{{ user.email }}</p>
                <p class="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                    Abrí el enlace para activar tu cuenta. Si no lo ves en unos minutos, revisá la carpeta de spam.
                </p>
                <RouterLink :to="{ path: '/login', query: redirectQuery }"
                    class="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                    Ir a iniciar sesión
                </RouterLink>
            </div>

            <template v-else>
                <div class="text-center mb-8">
                    <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">Creá tu cuenta</h1>
                    <p class="text-gray-600 m-0">Es gratis y te lleva menos de un minuto.</p>
                </div>

                <div class="bg-white rounded-2xl border border-gray-200 shadow-[0_12px_32px_-16px_rgba(18,45,70,0.25)] p-6 sm:p-8">
                    <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="name" class="field-label">Nombre</label>
                                <input type="text" id="name" v-model="user.name" @blur="touch('name')" autocomplete="given-name"
                                    class="field-input" :aria-invalid="!!showError('name')" aria-describedby="name-error" />
                                <p v-if="showError('name')" id="name-error" class="field-error">{{ errors.name }}</p>
                            </div>
                            <div>
                                <label for="lastName" class="field-label">Apellido</label>
                                <input type="text" id="lastName" v-model="user.lastName" @blur="touch('lastName')" autocomplete="family-name"
                                    class="field-input" :aria-invalid="!!showError('lastName')" aria-describedby="lastName-error" />
                                <p v-if="showError('lastName')" id="lastName-error" class="field-error">{{ errors.lastName }}</p>
                            </div>
                        </div>

                        <div>
                            <label for="email" class="field-label">Email</label>
                            <input type="email" id="email" v-model="user.email" @blur="touch('email')" autocomplete="email" inputmode="email"
                                class="field-input" placeholder="tu@email.com" :aria-invalid="!!showError('email')" aria-describedby="email-error" />
                            <p v-if="showError('email')" id="email-error" class="field-error">{{ errors.email }}</p>
                        </div>

                        <div>
                            <label for="password" class="field-label">Contraseña</label>
                            <div class="relative">
                                <input :type="showPassword ? 'text' : 'password'" id="password" v-model="user.password" @blur="touch('password')"
                                    autocomplete="new-password" class="field-input pr-12"
                                    :aria-invalid="!!showError('password')" aria-describedby="password-hint password-error" />
                                <button type="button" @click="showPassword = !showPassword"
                                    class="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                    :aria-label="showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'" :aria-pressed="showPassword">
                                    <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                </button>
                            </div>
                            <p v-if="showError('password')" id="password-error" class="field-error">{{ errors.password }}</p>
                            <p v-else id="password-hint" class="field-hint">Mínimo 6 caracteres.</p>
                        </div>

                        <div>
                            <label for="confirmPassword" class="field-label">Repetí la contraseña</label>
                            <input :type="showPassword ? 'text' : 'password'" id="confirmPassword" v-model="user.confirmPassword" @blur="touch('confirmPassword')"
                                autocomplete="new-password" class="field-input"
                                :aria-invalid="!!showError('confirmPassword')" aria-describedby="confirmPassword-error" />
                            <p v-if="showError('confirmPassword')" id="confirmPassword-error" class="field-error">{{ errors.confirmPassword }}</p>
                        </div>

                        <div v-if="errorMessage" class="p-4 rounded-lg bg-red-50 border border-red-200" role="alert">
                            <p class="text-red-800 text-sm font-semibold m-0">{{ errorMessage }}</p>
                        </div>

                        <button type="submit" :disabled="loading"
                            class="w-full h-12 px-4 bg-primary text-white font-semibold rounded-lg transition hover:bg-primary-600 disabled:opacity-60">
                            {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
                        </button>

                        <p class="text-xs text-gray-600 text-center m-0">
                            Al crear tu cuenta aceptás los
                            <RouterLink to="/terminos" class="font-semibold text-primary-700 underline underline-offset-2">Términos y condiciones</RouterLink>
                            y la
                            <RouterLink to="/privacidad" class="font-semibold text-primary-700 underline underline-offset-2">Política de privacidad</RouterLink>.
                        </p>
                    </form>
                </div>

                <p class="mt-6 text-center text-gray-600">
                    ¿Ya tenés cuenta?
                    <RouterLink :to="{ path: '/login', query: redirectQuery }" class="font-semibold text-primary-700 hover:underline underline-offset-4">
                        Iniciá sesión
                    </RouterLink>
                </p>
            </template>
        </div>
    </section>
</template>
