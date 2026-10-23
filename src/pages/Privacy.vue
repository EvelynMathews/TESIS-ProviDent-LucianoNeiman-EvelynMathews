<script>
/**
 * Política de privacidad de ProviDent.
 * Describe qué datos usa la plataforma (según lo que realmente guarda la app) y los derechos
 * del titular según la Ley 25.326. Se aclara que es un proyecto académico.
 */
export default {
    name: 'Privacy',
    data() {
        return {
            sections: [
                { id: 'datos', title: '1. Qué datos usamos' },
                { id: 'uso', title: '2. Para qué los usamos' },
                { id: 'compartir', title: '3. Con quién los compartimos' },
                { id: 'guardado', title: '4. Dónde se guardan' },
                { id: 'derechos', title: '5. Tus derechos' },
                { id: 'contacto', title: '6. Contacto' },
            ],
        }
    },
}
</script>

<template>
    <section class="bg-gray-50 pb-16">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            <header class="mb-8 max-w-prose">
                <h1 class="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Política de privacidad</h1>
                <p class="text-gray-600 m-0">Última actualización: 23 de octubre de 2026</p>
            </header>

            <p class="max-w-prose mb-10 px-4 py-3 rounded-lg bg-primary-50 border border-primary-100 text-primary-900 text-sm">
                ProviDent es un proyecto académico (tesis de la Escuela Da Vinci). Esta política describe cómo se tratan los datos dentro de la plataforma.
            </p>

            <div class="grid lg:grid-cols-[14rem_1fr] gap-10">
                <nav aria-label="Contenido" class="hidden lg:block">
                    <ol class="sticky top-24 space-y-2 text-sm">
                        <li v-for="s in sections" :key="s.id">
                            <a :href="`#${s.id}`" class="text-gray-700 hover:text-primary-700 hover:underline underline-offset-4">{{ s.title }}</a>
                        </li>
                    </ol>
                </nav>

                <article class="legal max-w-prose text-gray-800">
                    <h2 id="datos">1. Qué datos usamos</h2>
                    <ul>
                        <li><strong>Cuenta:</strong> nombre, apellido, email y contraseña (la contraseña se guarda cifrada; nadie puede verla).</li>
                        <li><strong>Perfil:</strong> foto, biografía y ubicación, si decidís cargarlas.</li>
                        <li><strong>Domicilios:</strong> calle, ciudad, provincia, código postal y quién recibe, para tus envíos.</li>
                        <li><strong>Actividad:</strong> tu carrito, tus publicaciones y, cuando el pago esté habilitado, tus pedidos.</li>
                    </ul>

                    <h2 id="uso">2. Para qué los usamos</h2>
                    <ul>
                        <li>Crear y proteger tu cuenta, e iniciar sesión.</li>
                        <li>Mostrar tus publicaciones y tu perfil público de vendedor.</li>
                        <li>Preparar pedidos y calcular envíos.</li>
                        <li>Responder tus consultas de soporte.</li>
                    </ul>
                    <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>

                    <h2 id="compartir">3. Con quién los compartimos</h2>
                    <p>Tu nombre, foto, biografía y ubicación son visibles en tu perfil público si vendés. Cuando compres, el vendedor recibirá los datos necesarios para entregar tu pedido. Fuera de eso, solo compartimos datos cuando la ley lo exige.</p>

                    <h2 id="guardado">4. Dónde se guardan</h2>
                    <p>Los datos se alojan en Supabase, un proveedor de infraestructura en la nube, con acceso restringido: cada usuario solo puede leer y modificar su propia información. Las fotos de perfil se guardan en un almacenamiento privado.</p>

                    <h2 id="derechos">5. Tus derechos</h2>
                    <p>Según la Ley 25.326 de Protección de Datos Personales, podés acceder a tus datos, corregirlos, actualizarlos o pedir que los eliminemos. Podés editar la mayoría desde <RouterLink to="/mi-perfil">Mi perfil</RouterLink>. La Agencia de Acceso a la Información Pública es el órgano de control de esta ley y atiende denuncias por incumplimientos.</p>

                    <h2 id="contacto">6. Contacto</h2>
                    <p>Para ejercer tus derechos o hacer consultas sobre privacidad, escribinos desde <RouterLink to="/chat">Soporte</RouterLink>. Mirá también los <RouterLink to="/terminos">Términos y condiciones</RouterLink>.</p>
                </article>
            </div>
        </div>
    </section>
</template>

<style scoped>
.legal :deep(h2) {
    scroll-margin-top: 6rem;
    margin: 2.25rem 0 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
}
.legal :deep(h2:first-child) { margin-top: 0; }
.legal :deep(p), .legal :deep(li) { line-height: 1.75; }
.legal :deep(p) { margin: 0 0 1rem; }
.legal :deep(ul) { list-style: disc; padding-left: 1.25rem; margin: 0 0 1rem; }
.legal :deep(li) { margin-bottom: 0.4rem; }
.legal :deep(a) { color: #1A4369; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
</style>
