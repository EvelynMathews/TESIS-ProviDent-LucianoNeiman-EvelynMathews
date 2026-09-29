<script>
/**
 * Modal de confirmación reutilizable (reemplaza al confirm() del navegador).
 * Emite `confirm` o `cancel`; la acción la resuelve la vista que lo usa.
 */
export default {
    name: 'ConfirmModal',
    props: {
        title: { type: String, required: true },
        message: { type: String, required: true },
        confirmText: { type: String, default: 'Confirmar' },
        loading: { type: Boolean, default: false }
    },
    emits: ['confirm', 'cancel']
}
</script>

<template>
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="!loading && $emit('cancel')">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <h3 id="confirm-modal-title" class="font-heading text-xl font-bold text-gray-800 mb-3">{{ title }}</h3>
            <p class="text-gray-600 text-sm mb-6">{{ message }}</p>
            <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" :disabled="loading" @click="$emit('cancel')"
                    class="px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50">
                    Cancelar
                </button>
                <button type="button" :disabled="loading" @click="$emit('confirm')"
                    class="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
                    {{ loading ? 'Procesando...' : confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>
