<!--
 * Iconos de categoría del catálogo, todos con el mismo estilo (trazo de 1.75px, 24x24).
 * Recibe `icon`: 'supply' | 'prosthesis' | 'plaster' | 'rental'. Cualquier otro valor muestra una grilla.
 -->

<template>
    <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
        stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <template v-if="icon === 'supply'">
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
            <path d="M7.5 5.5l9 5" />
        </template>
        <template v-else-if="icon === 'prosthesis'">
            <path d="M7 3C4.8 3 3 4.8 3 7.2c0 2 .7 3.3 1.4 4.6.6 1.2.9 2.6 1 4l.4 3.6c.1 1 .9 1.6 1.7 1.6.9 0 1.5-.7 1.7-1.6l.7-3.3c.2-.9.8-1.4 1.6-1.4h.2c.8 0 1.4.5 1.6 1.4l.7 3.3c.2.9.8 1.6 1.7 1.6.8 0 1.6-.6 1.7-1.6l.4-3.6c.1-1.4.4-2.8 1-4 .7-1.3 1.4-2.6 1.4-4.6C21 4.8 19.2 3 17 3c-1.6 0-2.6.8-5 .8S8.6 3 7 3z" />
        </template>
        <template v-else-if="icon === 'plaster'">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M4 7.5l8 4.5 8-4.5" />
            <path d="M12 12v9" />
        </template>
        <template v-else-if="icon === 'rental'">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
            <path d="M12 13.5v2.5l1.75 1" />
        </template>
        <template v-else>
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </template>
    </svg>
</template>

<script>
export default {
    name: 'CategoryIcon',
    props: {
        icon: {
            type: String,
            default: 'all'
        }
    }
}
</script>
