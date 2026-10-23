<!--
 * Pie de página del sitio público.
 * Propósito: Cerrar cada página con la información que un marketplace debe tener a mano:
 * marca y propuesta, navegación por secciones (catálogo, vendedores, ayuda), contacto,
 * redes, enlaces legales, el aviso de Defensa del Consumidor exigido en Argentina
 * para el comercio electrónico y la autoría del proyecto.
 * Funcionamiento: Componente de presentación. Los enlaces internos usan RouterLink;
 * las rutas privadas redirigen al login si hace falta.
 -->

<script>
import BrandLogo from './BrandLogo.vue'
import { catalogTypes } from '../data/catalog'

export default {
    name: 'Footer',
    components: { BrandLogo },
    data() {
        return {
            year: new Date().getFullYear(),
            marketplaceLinks: [
                { label: 'Todo el catálogo', to: '/productos' },
                ...catalogTypes.map(t => ({ label: t.name, to: { path: '/productos', query: { tipo: t.slug } } })),
            ],
            sellerLinks: [
                { label: 'Empezar a vender', to: '/seller-setup' },
                { label: 'Publicar un producto', to: '/publicar' },
                { label: 'Mis publicaciones', to: '/mis-productos' },
                { label: 'Métodos de envío', to: '/seller-setup' },
            ],
            helpLinks: [
                { label: 'Centro de soporte', to: '/chat' },
                { label: 'Mi cuenta', to: '/mi-perfil' },
                { label: 'Mi carrito', to: '/carrito' },
                { label: 'Crear una cuenta', to: '/register' },
            ],
        }
    },
}
</script>

<template>
    <footer class="bg-secondary-700 text-white" aria-labelledby="footer-heading">
        <h2 id="footer-heading" class="sr-only">Información de ProviDent</h2>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
            <div class="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10">
                <!-- Marca -->
                <div class="col-span-2 md:col-span-12 lg:col-span-4">
                    <RouterLink to="/" class="inline-flex items-center gap-2 rounded-lg" aria-label="ProviDent, ir al inicio">
                        <BrandLogo class="w-11 h-11 text-white" />
                        <span class="font-heading text-2xl font-bold tracking-tight">ProviDent</span>
                    </RouterLink>
                    <p class="mt-4 text-secondary-100 leading-relaxed max-w-sm">
                        El marketplace odontológico que conecta profesionales, laboratorios y proveedores de todo el país en un solo lugar.
                    </p>

                    <ul class="mt-6 space-y-3 text-sm">
                        <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 flex-shrink-0 text-secondary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 10h8M8 14h5m-9 6l2.6-2.6A2 2 0 018 16.8h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14z" />
                            </svg>
                            <span>
                                ¿Necesitás ayuda?
                                <RouterLink to="/chat" class="font-semibold underline underline-offset-4 decoration-secondary-300 hover:decoration-white">Escribinos por Soporte</RouterLink>
                            </span>
                        </li>
                        <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 flex-shrink-0 text-secondary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 21s-7-6.2-7-11.5a7 7 0 1114 0C19 14.8 12 21 12 21z" />
                                <circle cx="12" cy="9.5" r="2.5" stroke-width="1.75" />
                            </svg>
                            <span class="text-secondary-100">Buenos Aires, Argentina · Envíos a todo el país</span>
                        </li>
                    </ul>

                    <div class="mt-6 flex items-center gap-2">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                            aria-label="ProviDent en Instagram (se abre en otra pestaña)"
                            class="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                        </a>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                            aria-label="ProviDent en TikTok (se abre en otra pestaña)"
                            class="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Columnas de navegación -->
                <nav class="md:col-span-4 lg:col-span-3 lg:col-start-6" aria-labelledby="footer-marketplace">
                    <h3 id="footer-marketplace" class="footer-title">Marketplace</h3>
                    <ul class="space-y-2.5">
                        <li v-for="link in marketplaceLinks" :key="link.label">
                            <RouterLink :to="link.to" class="footer-link">{{ link.label }}</RouterLink>
                        </li>
                    </ul>
                </nav>

                <nav class="md:col-span-4 lg:col-span-2" aria-labelledby="footer-sellers">
                    <h3 id="footer-sellers" class="footer-title">Vendedores</h3>
                    <ul class="space-y-2.5">
                        <li v-for="link in sellerLinks" :key="link.label">
                            <RouterLink :to="link.to" class="footer-link">{{ link.label }}</RouterLink>
                        </li>
                    </ul>
                </nav>

                <nav class="col-span-2 md:col-span-4 lg:col-span-2" aria-labelledby="footer-help">
                    <h3 id="footer-help" class="footer-title">Ayuda</h3>
                    <ul class="space-y-2.5">
                        <li v-for="link in helpLinks" :key="link.label">
                            <RouterLink :to="link.to" class="footer-link">{{ link.label }}</RouterLink>
                        </li>
                    </ul>
                </nav>
            </div>

            <!-- Defensa del Consumidor (Res. 316/2018, obligatoria para comercio electrónico en Argentina) -->
            <div class="mt-12 rounded-xl bg-white/5 border border-white/15 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                <p class="m-0 text-secondary-100">
                    <span class="font-semibold text-white">Defensa de las y los Consumidores.</span>
                    Para reclamos
                    <a href="https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor"
                        target="_blank" rel="noopener noreferrer"
                        class="font-semibold text-white underline underline-offset-4 decoration-secondary-300 hover:decoration-white">
                        ingresá aquí<span class="sr-only"> (sitio oficial, se abre en otra pestaña)</span>
                    </a>.
                </p>
                <p class="m-0 sm:ml-auto text-secondary-100">
                    El pago online todavía no está habilitado.
                </p>
            </div>
        </div>

        <!-- Barra inferior -->
        <div class="border-t border-white/15">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row lg:items-center gap-4 text-sm">
                <p class="m-0 text-secondary-100 lg:shrink-0">
                    © {{ year }} ProviDent. Todos los derechos reservados.
                </p>
                <ul class="flex flex-wrap lg:flex-nowrap lg:shrink-0 gap-x-6 gap-y-2 lg:ml-6 whitespace-nowrap">
                    <li><RouterLink to="/terminos" class="footer-link">Términos y condiciones</RouterLink></li>
                    <li><RouterLink to="/privacidad" class="footer-link">Política de privacidad</RouterLink></li>
                </ul>
                <p class="m-0 lg:ml-auto lg:text-right xl:whitespace-nowrap text-secondary-100">
                    Tesis · Escuela Da Vinci · <span class="font-semibold text-white">Luciano Neiman</span> y <span class="font-semibold text-white">Evelyn Mathews</span>
                </p>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer-title {
    margin-bottom: 1rem;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
}

.footer-link {
    color: #C7EFE7;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 4px;
    transition: color 0.15s, text-decoration-color 0.15s;
}

.footer-link:hover {
    color: #fff;
    text-decoration-color: currentColor;
}

footer :focus-visible {
    outline-color: #fff;
}
</style>
