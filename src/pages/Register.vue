<script>
/**
 * Propósito: Vista de registro de nuevos usuarios (formulario multi-paso).
 * Función: Recoger los datos básicos del usuario (acceso y personales) y registrarlo en la plataforma.
 * Cómo funciona: Implementa un formulario de dos pasos (`currentStep`) con validaciones básicas (`canGoNext`, `passwordMatch`). Llama a la función `register` del servicio `auth.js`. Si la confirmación de email está activa (por defecto en Supabase), muestra un mensaje de éxito con instrucciones para verificar la cuenta.
 */
import { register } from '../services/auth'

export default {
    name: 'Register',
    data() {
        return {
            currentStep: 1,
            totalSteps: 2,
            user: {
                email: '',
                password: '',
                confirmPassword: '',
                name: '',
                lastName: ''
                // Removed: phone/address fields not required at registration
                // Avatar se sube después de confirmar email, desde /mi-perfil/editar
            },
            loading: false,
            errorMessage: '',
            registrationSuccess: false,
            requiresEmailConfirmation: false,
        }
    },
    computed: {
        progressPercentage() {
            return (this.currentStep / this.totalSteps) * 100
        },
        canGoNext() {
            switch (this.currentStep) {
                case 1:
                    return this.user.email && this.user.password && this.user.confirmPassword &&
                        this.user.password === this.user.confirmPassword && this.user.password.length >= 6
                case 2:
                    return this.user.name && this.user.lastName
                default:
                    return false
            }
        },
        passwordMatch() {
            if (!this.user.password || !this.user.confirmPassword) return true
            return this.user.password === this.user.confirmPassword
        }
    },
    methods: {
        nextStep() {
            if (this.canGoNext && this.currentStep < this.totalSteps) {
                this.currentStep++
                this.errorMessage = ''
            }
        },
        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--
                this.errorMessage = ''
            }
        },
        async handleSubmit() {
            this.loading = true
            this.errorMessage = ''

            try {
                const result = await register(this.user.email, this.user.password, {
                    name: this.user.name,
                    lastName: this.user.lastName
                })

                if (result.requiresEmailConfirmation) {
                    // Mostrar mensaje de confirmación de email
                    this.registrationSuccess = true
                    this.requiresEmailConfirmation = true
                } else {
                    // Login automático exitoso
                    this.$router.push('/mi-perfil')
                }
            } catch (error) {
                console.error('Error al registrar:', error)
                // Mostrar mensaje de error específico
                if (error.message) {
                    this.errorMessage = error.message
                } else {
                    this.errorMessage = 'No se pudo crear la cuenta. Revisá los datos ingresados.'
                }
            } finally {
                this.loading = false
            }
        }
    },
}
</script>

<template>
    <section class="min-h-screen bg-gray-50 py-12 px-4 pt-24">
        <div class="max-w-2xl mx-auto">
            <div class="text-center mb-8">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
                    style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                    <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                </div>
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">Creá tu cuenta en ProviDent</h1>
                <p class="text-gray-600">Completá los siguientes pasos para registrarte</p>
            </div>

            <div class="mb-8">
                <div class="flex justify-between items-center mb-4">
                    <div v-for="step in totalSteps" :key="step" class="flex-1 flex items-center">
                        <div class="flex flex-col items-center flex-1">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-md"
                                :style="{
                                    backgroundColor: step <= currentStep ? '#2A6FAF' : '#E5E7EB',
                                    color: step <= currentStep ? 'white' : '#9CA3AF'
                                }">
                                <svg v-if="step < currentStep" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clip-rule="evenodd"></path>
                                </svg>
                                <span v-else>{{ step }}</span>
                            </div>
                            <p class="text-xs mt-2 text-center font-semibold"
                                :style="{ color: step <= currentStep ? '#2A6FAF' : '#9CA3AF' }">
                                {{ step === 1 ? 'Acceso' : step === 2 ? 'Datos' : step === 3 ? 'Dirección' : 'Confirmar'}}
                            </p>
                        </div>
                        <div v-if="step < totalSteps" class="flex-1 h-1 mx-2 rounded"
                            :style="{ backgroundColor: step < currentStep ? '#2A6FAF' : '#E5E7EB' }">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Success Message -->
            <div v-if="registrationSuccess && requiresEmailConfirmation" class="bg-white rounded-lg shadow-md p-8">
                <div class="text-center py-8">
                    <div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
                        style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                        <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                        </svg>
                    </div>

                    <h1 class="font-heading text-3xl font-bold text-gray-800 mb-3">¡Cuenta creada!</h1>
                    <p class="text-gray-600 mb-2 max-w-md mx-auto">
                        Te enviamos un email de confirmación a:
                    </p>
                    <p class="text-lg font-semibold mb-6" style="color: #2A6FAF;">{{ user.email }}</p>

                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                        <p class="text-sm text-blue-800">
                            <strong>📧 Revisá tu casilla de correo</strong><br>
                            Hacé clic en el enlace que te enviamos para confirmar tu cuenta y poder iniciar sesión.
                        </p>
                    </div>

                    <div class="space-y-3 max-w-md mx-auto">
                        <p class="text-sm text-gray-600">¿No recibiste el email?</p>
                        <ul class="text-xs text-gray-500 text-left space-y-1">
                            <li>• Revisá tu carpeta de spam o correo no deseado</li>
                            <li>• Verificá que escribiste bien tu dirección de email</li>
                            <li>• El email puede tardar algunos minutos en llegar</li>
                        </ul>
                    </div>

                    <div class="mt-8">
                        <RouterLink to="/login"
                            class="inline-block px-6 py-3 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
                            style="background-color: #2A6FAF;">
                            Ir a iniciar sesión
                        </RouterLink>
                    </div>
                </div>
            </div>

            <div v-else class="bg-white rounded-lg shadow-md p-8">
                <form @submit.prevent="currentStep === totalSteps ? handleSubmit() : nextStep()">
                    <div v-if="currentStep === 1" class="space-y-6">
                        <div class="p-4 rounded-lg" style="background-color: #E3EEF8;">
                            <h2 class="font-heading text-xl font-bold mb-2" style="color: #2A6FAF;">Paso 1: Datos de
                                acceso</h2>
                            <p class="text-sm text-gray-600">Creá tu usuario y contraseña</p>
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                                Correo electrónico *
                            </label>
                            <input type="email" id="email" v-model="user.email" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                placeholder="tu@email.com" />
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                                Contraseña *
                            </label>
                            <input type="password" id="password" v-model="user.password" required minlength="6"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                placeholder="Mínimo 6 caracteres" />
                            <p class="text-xs text-gray-500 mt-1">Debe tener al menos 6 caracteres</p>
                        </div>

                        <div>
                            <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                                Confirmar contraseña *
                            </label>
                            <input type="password" id="confirmPassword" v-model="user.confirmPassword" required
                                class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition"
                                :class="passwordMatch ? 'border-gray-300' : 'border-red-300'"
                                placeholder="Repetí tu contraseña" />
                            <p v-if="!passwordMatch" class="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
                        </div>
                    </div>

                    <div v-if="currentStep === 2" class="space-y-6">
                        <div class="p-4 rounded-lg" style="background-color: #D4F4EC;">
                            <h2 class="font-heading text-xl font-bold mb-2" style="color: #29A68C;">Paso 2: Datos
                                personales</h2>
                            <p class="text-sm text-gray-600">Contanos sobre vos</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                                    Nombre *
                                </label>
                                <input type="text" id="name" v-model="user.name" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                    placeholder="Juan" />
                            </div>

                            <div>
                                <label for="lastName" class="block text-sm font-semibold text-gray-700 mb-2">
                                    Apellido *
                                </label>
                                <input type="text" id="lastName" v-model="user.lastName" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                    placeholder="Pérez" />
                            </div>
                        </div>

                        <div v-if="false"></div>
                    </div>

                    <div v-if="false" class="space-y-6">
                        <div class="p-4 rounded-lg" style="background-color: #F8E8E2;">
                            <h2 class="font-heading text-xl font-bold mb-2" style="color: #DC8C73;">Paso 3: Dirección
                            </h2>
                            <p class="text-sm text-gray-600">¿Dónde te encontrás?</p>
                        </div>

                        <div>
                            <label for="street" class="block text-sm font-semibold text-gray-700 mb-2">
                                Calle y número *
                            </label>
                            <input type="text" id="street" v-model="user.street" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                placeholder="Av. Corrientes 1234" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="city" class="block text-sm font-semibold text-gray-700 mb-2">
                                    Ciudad *
                                </label>
                                <input type="text" id="city" v-model="user.city" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                    placeholder="CABA" />
                            </div>

                            <div>
                                <label for="province" class="block text-sm font-semibold text-gray-700 mb-2">
                                    Provincia *
                                </label>
                                <input type="text" id="province" v-model="user.province" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                    placeholder="Buenos Aires" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="postalCode" class="block text-sm font-semibold text-gray-700 mb-2">
                                    Código postal *
                                </label>
                                <input type="text" id="postalCode" v-model="user.postalCode" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                                    placeholder="C1043" />
                            </div>

                            <div>
                                <label for="country" class="block text-sm font-semibold text-gray-700 mb-2">
                                    País
                                </label>
                                <input type="text" id="country" v-model="user.country" disabled
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div v-if="currentStep === 4" class="space-y-6">
                        <div class="p-4 rounded-lg"
                            style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                            <h2 class="font-heading text-xl font-bold text-white mb-2">Paso 4: Confirmación</h2>
                            <p class="text-sm text-white opacity-90">Revisá tus datos antes de continuar</p>
                        </div>

                        <div class="space-y-4">
                            <div class="p-4 rounded-lg bg-gray-50">
                                <h3 class="font-semibold text-gray-800 mb-3">Datos de acceso</h3>
                                <p class="text-sm text-gray-600"><span class="font-semibold">Email:</span> {{ user.email}}</p>
                            </div>

                            <div class="p-4 rounded-lg bg-gray-50">
                                <h3 class="font-semibold text-gray-800 mb-3">Datos personales</h3>
                                <p class="text-sm text-gray-600"><span class="font-semibold">Nombre:</span> {{ user.name}} {{ user.lastName }}</p>
                                <p class="text-sm text-gray-600"><span class="font-semibold">Teléfono:</span> {{user.phone }}</p>
                            </div>

                            <div class="p-4 rounded-lg bg-gray-50">
                                <h3 class="font-semibold text-gray-800 mb-3">Dirección</h3>
                                <p class="text-sm text-gray-600">{{ user.street }}</p>
                                <p class="text-sm text-gray-600">{{ user.city }}, {{ user.province }}</p>
                                <p class="text-sm text-gray-600">CP: {{ user.postalCode }} - {{ user.country }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="errorMessage" class="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
                        <p class="text-red-600 text-sm font-semibold">{{ errorMessage }}</p>
                    </div>

                    <div class="flex gap-4 mt-8">
                        <button v-if="currentStep > 1" type="button" @click="prevStep"
                            class="flex-1 py-3 px-4 border-2 font-semibold rounded-lg transition hover:bg-gray-50"
                            style="color: #2A6FAF; border-color: #2A6FAF;">
                            Anterior
                        </button>

                        <button v-if="currentStep < totalSteps" type="button" @click="nextStep" :disabled="!canGoNext"
                            class="flex-1 py-3 px-4 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style="background-color: #2A6FAF;">
                            Siguiente
                        </button>

                        <button v-if="currentStep === totalSteps" type="submit" :disabled="loading"
                            class="flex-1 py-3 px-4 text-white font-semibold rounded-lg shadow-md transition hover:opacity-90 disabled:opacity-50"
                            style="background-color: #29A68C;">
                            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
                        </button>
                    </div>
                </form>
            </div>

            <div class="mt-6 text-center">
                <p class="text-gray-600">
                    ¿Ya tenés cuenta?
                    <RouterLink to="/login" class="font-semibold hover:underline" style="color: #2A6FAF;">
                        Iniciá sesión
                    </RouterLink>
                </p>
            </div>
        </div>
    </section>
</template>
