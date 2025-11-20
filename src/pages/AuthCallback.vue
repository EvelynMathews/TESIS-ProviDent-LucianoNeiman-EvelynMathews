<script>
/**
 * Vista de manejo de redirección después de la autenticación.
 * Propósito: Capturar y procesar los tokens/parámetros de la URL
 * que Supabase Auth utiliza para establecer la sesión del usuario
 * después de procesos como la confirmación de correo electrónico.
 * Funcionamiento: Al montarse, el componente inspecciona el hash de la URL
 * para detectar tokens de sesión. Intenta obtener la sesión de Supabase.
 * Si tiene éxito, redirige al perfil del usuario (`/mi-perfil`).
 * Si falla (ej. link inválido o error de sesión), muestra un mensaje de error.
 */

import { supabase } from '../services/supabase'

export default {
    name: 'AuthCallback',
    data() {
        return {
            loading: true,
            error: null
        }
    },
    async mounted() {
        try {
            // Obtener el token del hash de la URL
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            const type = hashParams.get('type')

            if (type === 'signup' || type === 'email_change' || accessToken) {
                // Supabase maneja automáticamente la sesión desde el hash
                // Solo necesitamos esperar a que se procese
                const { data, error } = await supabase.auth.getSession()

                if (error) throw error

                if (data.session) {
                    // Email confirmado exitosamente - redirigir a perfil
                    // El usuario puede subir su avatar desde /mi-perfil/editar
                    this.$router.push('/mi-perfil')
                } else {
                    throw new Error('No se pudo establecer la sesión')
                }
            } else {
                throw new Error('Link de confirmación inválido')
            }
        } catch (err) {
            console.error('Error en callback:', err)
            this.error = err.message || 'Error al confirmar el email'
            this.loading = false
        }
    }
}
</script>

<template>
    <section class="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div class="max-w-md mx-auto px-4 text-center">
            <div v-if="loading" class="bg-white rounded-lg shadow-md p-8">
                <div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                    <svg class="animate-spin w-10 h-10 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <h1 class="font-heading text-2xl font-bold text-gray-800 mb-2">Confirmando tu email...</h1>
                <p class="text-gray-600">Esto solo tomará un momento</p>
            </div>

            <div v-else class="bg-white rounded-lg shadow-md p-8">
                <div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-100">
                    <svg class="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <h1 class="font-heading text-2xl font-bold text-gray-800 mb-2">Error al confirmar</h1>
                <p class="text-gray-600 mb-6">{{ error }}</p>
                <div class="space-y-3">
                    <RouterLink to="/register"
                        class="block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Volver a registrarse
                    </RouterLink>
                    <RouterLink to="/login"
                        class="block px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50">
                        Ir a iniciar sesión
                    </RouterLink>
                </div>
            </div>
        </div>
    </section>
</template>
