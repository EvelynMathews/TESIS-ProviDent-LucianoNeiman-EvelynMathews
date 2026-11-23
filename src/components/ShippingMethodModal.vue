<script>
/**
 * Modal que muestra el formulario de método de envío sin salir de la página
 * (se usa en Publicar y en Configurar ventas).
 */
import ShippingMethodForm from './ShippingMethodForm.vue'
import ShippingIcon from './ShippingIcon.vue'

export default {
    name: 'ShippingMethodModal',
    components: { ShippingMethodForm, ShippingIcon },
    props: {
        method: { type: Object, default: null }
    },
    emits: ['saved', 'close'],
    mounted() {
        document.body.classList.add('overflow-hidden')
    },
    unmounted() {
        document.body.classList.remove('overflow-hidden')
    }
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[200] sm:p-4" @click.self="$emit('close')">
            <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto p-6"
                role="dialog" aria-modal="true" aria-labelledby="shipping-modal-title">
                <div class="flex items-center gap-3 mb-5">
                    <span class="w-11 h-11 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                        <ShippingIcon icon="truck" class="w-6 h-6" />
                    </span>
                    <div>
                        <h2 id="shipping-modal-title" class="font-heading text-xl font-bold text-gray-800 mb-0">
                            {{ method ? 'Editar método de envío' : 'Nuevo método de envío' }}
                        </h2>
                        <p class="text-sm text-gray-600 m-0">Contanos cuánto cuesta, cuánto tarda y a dónde llega.</p>
                    </div>
                </div>
                <ShippingMethodForm :method="method" :submit-text="method ? 'Guardar cambios' : 'Crear método'"
                    @saved="$emit('saved', $event)" @cancel="$emit('close')" />
            </div>
        </div>
    </Teleport>
</template>
