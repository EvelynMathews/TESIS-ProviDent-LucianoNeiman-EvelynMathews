<script>
/**
 * Propósito: Página de contacto con soporte.
 * Función: Ofrecer dos canales de contacto: WhatsApp y email, con el horario de atención.
 * Cómo funciona: Toma los datos de `config/support.js`. Si no hay número de WhatsApp
 * configurado, solo se muestra la opción de email.
 */
import { SUPPORT, whatsappUrl } from '../config/support'

export default {
    name: 'Support',
    data() {
        return {
            support: SUPPORT
        }
    },
    computed: {
        whatsappLink() {
            return whatsappUrl()
        },
        mailtoLink() {
            return `mailto:${SUPPORT.email}?subject=${encodeURIComponent('Consulta de soporte - ProviDent')}`
        }
    }
}
</script>

<template>
    <section class="pt-20 pb-16 min-h-screen bg-surface">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div class="text-center mb-10">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg bg-linear-135 from-primary to-secondary">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">¿Necesitás ayuda?</h1>
                <p class="text-gray-600">Elegí cómo querés contactarte con el equipo de ProviDent.</p>
            </div>

            <div class="grid grid-cols-1 gap-6" :class="{ 'md:grid-cols-2': whatsappLink }">
                <div v-if="whatsappLink" class="bg-white rounded-lg shadow-md p-6 flex flex-col">
                    <div class="w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-[#25D366]/15 text-[#128C7E]">
                        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </div>
                    <h2 class="font-heading text-xl font-bold text-gray-800 mb-2">WhatsApp</h2>
                    <p class="text-gray-600 text-sm mb-4 flex-1">
                        La forma más rápida. Te respondemos por chat en el horario de atención.
                    </p>
                    <p class="text-sm text-gray-500 mb-4">{{ support.hours }}</p>
                    <a :href="whatsappLink" target="_blank" rel="noopener noreferrer"
                        class="block w-full text-center py-3 px-4 rounded-lg font-semibold text-white bg-[#25D366] hover:opacity-90 transition shadow-md">
                        Escribir por WhatsApp
                    </a>
                </div>

                <div class="bg-white rounded-lg shadow-md p-6 flex flex-col">
                    <div class="w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-primary-50 text-primary">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 class="font-heading text-xl font-bold text-gray-800 mb-2">Email</h2>
                    <p class="text-gray-600 text-sm mb-4 flex-1">
                        Ideal para consultas con más detalle. Respondemos dentro de las 48 hs hábiles.
                    </p>
                    <p class="text-sm text-gray-500 mb-1">{{ support.hours }}</p>
                    <p class="font-semibold text-primary break-all mb-4">{{ support.email }}</p>
                    <a :href="mailtoLink"
                        class="block w-full text-center py-3 px-4 rounded-lg font-semibold text-white bg-primary hover:opacity-90 transition shadow-md">
                        Escribir un email
                    </a>
                </div>
            </div>
        </div>
    </section>
</template>
