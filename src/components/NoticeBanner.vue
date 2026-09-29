<script>
/**
 * Aviso de éxito o error dentro de la página (reemplaza al alert() del navegador).
 */
export default {
    name: 'NoticeBanner',
    props: {
        type: { type: String, default: 'success' },
        message: { type: String, required: true }
    },
    emits: ['close']
}
</script>

<template>
    <div role="status" class="mb-6 p-4 border-l-4 rounded-lg flex items-start gap-3"
        :class="type === 'error' ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'">
        <svg v-if="type === 'error'" class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"></path>
        </svg>
        <svg v-else class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"></path>
        </svg>
        <p class="text-sm font-medium flex-1" :class="type === 'error' ? 'text-red-800' : 'text-green-800'">{{ message }}</p>
        <button type="button" aria-label="Cerrar aviso" @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
</template>
