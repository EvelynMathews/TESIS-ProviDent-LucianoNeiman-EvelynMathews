<script>
/**
 * Modal de recuperación de contraseña.
 * La recuperación es manual: el usuario escribe a soporte y un administrador
 * le asigna una contraseña nueva desde Supabase (no se usa envío de emails).
 */
import { SUPPORT } from '../config/support'

export default {
    name: 'ForgotPasswordModal',
    props: {
        message: {
            type: String,
            required: true
        }
    },
    emits: ['close'],
    data() {
        return {
            supportEmail: SUPPORT.email
        }
    }
}
</script>

<template>
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
            <div class="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-primary-50">
                <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            </div>

            <h3 id="forgot-password-title" class="font-heading text-xl font-bold text-gray-800 text-center mb-3">
                ¿Olvidaste tu contraseña?
            </h3>
            <p class="text-gray-600 text-sm text-center mb-4">{{ message }}</p>

            <div class="p-4 rounded-lg bg-primary-50 border border-primary-100 text-center mb-6">
                <p class="text-xs text-gray-600 mb-1">Escribinos a</p>
                <p class="font-semibold text-primary break-all">{{ supportEmail }}</p>
            </div>

            <button type="button" @click="$emit('close')"
                class="w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md bg-primary hover:opacity-90 transition">
                Entendido
            </button>
        </div>
    </div>
</template>
