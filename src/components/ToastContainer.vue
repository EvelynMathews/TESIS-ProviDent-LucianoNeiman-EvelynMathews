<script>
/**
 * Muestra las notificaciones flotantes del servicio `toast.js`.
 * Se monta una sola vez en App.vue.
 */
import { subscribeToToasts, dismissToast } from '../services/toast'

let unsubscribe = () => { }

export default {
    name: 'ToastContainer',
    data() {
        return {
            toasts: []
        }
    },
    methods: {
        dismiss(id) {
            dismissToast(id)
        },
        toastClasses(type) {
            const classes = {
                success: 'bg-green-100 border-green-400 text-green-700',
                error: 'bg-red-100 border-red-400 text-red-700',
                info: 'bg-primary-50 border-primary-200 text-primary-700'
            }
            return classes[type] || classes.success
        }
    },
    mounted() {
        unsubscribe = subscribeToToasts(list => { this.toasts = list })
    },
    unmounted() {
        unsubscribe()
    }
}
</script>

<template>
    <div class="fixed bottom-22 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-96 z-[60] flex flex-col gap-3"
        aria-live="polite">
        <TransitionGroup name="toast">
            <div v-for="toast in toasts" :key="toast.id" role="status"
                class="flex items-start gap-3 p-4 rounded-lg border shadow-lg" :class="toastClasses(toast.type)">
                <svg v-if="toast.type === 'error'" class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"></path>
                </svg>
                <svg v-else-if="toast.type === 'info'" class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"></path>
                </svg>
                <svg v-else class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"></path>
                </svg>
                <p class="flex-1 text-sm font-semibold">{{ toast.message }}</p>
                <button type="button" aria-label="Cerrar aviso" @click="dismiss(toast.id)" class="opacity-60 hover:opacity-100 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(0.5rem);
}
</style>
