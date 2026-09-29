<script>
/**
 * Modal con el detalle de un aviso de empleo (sección Clasificados del Home).
 */
export default {
    name: 'ClassifiedModal',
    props: {
        ad: { type: Object, required: true },
        accentClass: { type: String, default: 'bg-linear-135 from-[#D4E9F4] to-[#C3DEF0]' }
    },
    emits: ['close'],
    computed: {
        mailtoLink() {
            const subject = encodeURIComponent(`Postulación: ${this.ad.title}`)
            return `mailto:${this.ad.contact_email}?subject=${subject}`
        },
        publishedDate() {
            return new Date(this.ad.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
        }
    },
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
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            role="dialog" aria-modal="true" aria-labelledby="classified-title">
            <div class="p-6 rounded-t-2xl relative" :class="accentClass">
                <button type="button" aria-label="Cerrar" @click="$emit('close')"
                    class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-gray-600 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <span v-if="ad.job_type" class="inline-block mb-3 px-3 py-1 text-xs font-semibold rounded-full bg-white/70 text-gray-700">
                    {{ ad.job_type }}
                </span>
                <h3 id="classified-title" class="font-heading text-2xl font-bold text-gray-800 pr-8 mb-1">{{ ad.title }}</h3>
                <p class="text-gray-700 font-semibold">{{ ad.company }}</p>
                <p v-if="ad.location" class="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                    </svg>
                    {{ ad.location }}
                </p>
            </div>

            <div class="p-6 space-y-5">
                <div v-if="ad.description">
                    <h4 class="font-heading font-bold text-gray-800 mb-2">Descripción del puesto</h4>
                    <p class="text-gray-600 text-sm leading-relaxed">{{ ad.description }}</p>
                </div>
                <div v-if="ad.requirements">
                    <h4 class="font-heading font-bold text-gray-800 mb-2">Requisitos</h4>
                    <p class="text-gray-600 text-sm leading-relaxed">{{ ad.requirements }}</p>
                </div>
                <p class="text-xs text-gray-500">Publicado el {{ publishedDate }}</p>

                <div v-if="ad.contact_email" class="pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-600 mb-1">Para postularte, enviá tu CV a</p>
                    <p class="font-semibold text-primary break-all mb-4">{{ ad.contact_email }}</p>
                    <a :href="mailtoLink"
                        class="block w-full text-center py-3 px-6 rounded-lg font-semibold text-white bg-primary hover:opacity-90 transition shadow-md">
                        Postularme por email
                    </a>
                </div>
            </div>
        </div>
    </div>
    </Teleport>
</template>
