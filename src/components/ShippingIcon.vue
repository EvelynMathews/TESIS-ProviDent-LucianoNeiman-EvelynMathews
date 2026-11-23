<!--
 * Iconos de envíos, con el mismo estilo que CategoryIcon (trazo de 1.75px, 24x24).
 * Recibe `icon`: 'truck' | 'price' | 'clock' | 'pin' | 'country' | 'map' | 'package'.
 * El tamaño y el color se pasan con clases desde afuera (ej: class="w-5 h-5 text-primary").
 -->

<template>
    <svg class="shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
        stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <template v-if="icon === 'truck'">
            <path d="M14 17V6a1 1 0 00-1-1H3a1 1 0 00-1 1v10a1 1 0 001 1h1.5" />
            <path d="M14 8h3.5l3.5 4.5V16a1 1 0 01-1 1h-1.5" />
            <path d="M9.5 17h5" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
        </template>
        <template v-else-if="icon === 'price'">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M6 12h.01M18 12h.01" />
        </template>
        <template v-else-if="icon === 'clock'">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </template>
        <template v-else-if="icon === 'pin'">
            <path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 0114 0z" />
            <circle cx="12" cy="10" r="2.5" />
        </template>
        <template v-else-if="icon === 'country'">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
        </template>
        <template v-else-if="icon === 'map'">
            <path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z" />
            <path d="M9 4v13.5M15 6.5V20" />
        </template>
        <template v-else>
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
            <path d="M7.5 5.5l9 5" />
        </template>
    </svg>
</template>

<script>
export default {
    name: 'ShippingIcon',
    props: {
        icon: {
            type: String,
            default: 'package'
        }
    }
}
</script>
