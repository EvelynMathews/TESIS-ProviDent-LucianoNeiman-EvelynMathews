<script>
/**
 * Página 404: se muestra cuando la URL no coincide con ninguna ruta.
 * Ofrece caminos claros para seguir navegando en lugar de una pantalla vacía.
 */
export default {
    name: 'NotFound',
}
</script>

<template>
    <section class="min-h-[70vh] flex items-center justify-center px-4 py-16" style="background-color: #F5FEFF;">
        <div class="max-w-lg text-center">
            <p class="font-heading text-7xl font-extrabold text-primary-200 mb-2" aria-hidden="true">404</p>
            <h1 class="font-heading text-3xl font-bold text-gray-800">No encontramos esta página</h1>
            <p class="text-gray-600 mb-8">
                Puede que el enlace esté roto o que la página se haya movido. Probá buscar en el catálogo o volvé al inicio.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <RouterLink to="/productos"
                    class="px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-primary-600 transition">
                    Ver catálogo
                </RouterLink>
                <RouterLink to="/"
                    class="px-6 py-3 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary-50 transition">
                    Ir al inicio
                </RouterLink>
            </div>
        </div>
    </section>
</template>
