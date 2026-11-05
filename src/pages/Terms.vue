<script>
/**
 * Términos y condiciones de uso de ProviDent.
 * Texto base para el marketplace; se aclara que es un proyecto académico.
 */
export default {
    name: 'Terms',
    data() {
        return {
            sections: [
                { id: 'objeto', title: '1. Qué es ProviDent' },
                { id: 'cuenta', title: '2. Tu cuenta' },
                { id: 'compradores', title: '3. Compras y servicios' },
                { id: 'vendedores', title: '4. Vendedores y publicaciones' },
                { id: 'productos', title: '5. Productos de uso odontológico' },
                { id: 'pagos', title: '6. Pagos y envíos' },
                { id: 'responsabilidad', title: '7. Responsabilidad' },
                { id: 'consumidor', title: '8. Derechos del consumidor' },
                { id: 'cambios', title: '9. Cambios en estos términos' },
            ],
        }
    },
}
</script>

<template>
    <section class="bg-gray-50 pb-16">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            <header class="mb-8 max-w-prose">
                <h1 class="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Términos y condiciones</h1>
                <p class="text-gray-600 m-0">Última actualización: 23 de octubre de 2026</p>
            </header>

            <p class="max-w-prose mb-10 px-4 py-3 rounded-lg bg-primary-50 border border-primary-100 text-primary-900 text-sm">
                ProviDent es un proyecto académico (tesis de la Escuela Da Vinci). Estos términos describen cómo funcionaría el servicio y no constituyen una oferta comercial vigente.
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
                    <h2 id="objeto">1. Qué es ProviDent</h2>
                    <p>ProviDent es una plataforma que conecta a profesionales de la odontología con proveedores de insumos, laboratorios dentales y personas que alquilan equipamiento. ProviDent no fabrica ni vende los productos publicados: cada publicación pertenece a su vendedor.</p>

                    <h2 id="cuenta">2. Tu cuenta</h2>
                    <ul>
                        <li>Para comprar o vender necesitás una cuenta con datos reales y un email válido.</li>
                        <li>Sos responsable de mantener tu contraseña en reserva y de la actividad que se haga con tu cuenta.</li>
                        <li>Podemos suspender cuentas que publiquen información falsa, infrinjan la ley o afecten a otros usuarios.</li>
                    </ul>

                    <h2 id="compradores">3. Compras y servicios</h2>
                    <p>Los precios, el stock, los plazos de fabricación y las condiciones de alquiler los define cada vendedor. Antes de confirmar un pedido revisá la descripción, la configuración elegida (piezas, fechas, detalles del trabajo) y el costo de envío.</p>

                    <h2 id="vendedores">4. Vendedores y publicaciones</h2>
                    <ul>
                        <li>El vendedor garantiza que tiene derecho a vender lo que publica y que la información es veraz y está actualizada.</li>
                        <li>Las imágenes deben corresponder al producto o servicio ofrecido.</li>
                        <li>El vendedor es responsable de cumplir con los pedidos aceptados, los envíos que configure y la facturación correspondiente.</li>
                        <li>Podemos pausar o eliminar publicaciones que no cumplan estos términos.</li>
                    </ul>

                    <h2 id="productos">5. Productos de uso odontológico</h2>
                    <p>Los productos médicos y odontológicos deben cumplir la normativa vigente, incluidas las disposiciones de la ANMAT cuando correspondan. Su uso clínico es responsabilidad del profesional que los adquiere.</p>

                    <h2 id="pagos">6. Pagos y envíos</h2>
                    <p>El pago online todavía no está habilitado. Cuando lo esté, los cobros se procesarán a través de proveedores de pago externos. Los envíos se calculan según los métodos, zonas y tarifas configurados por cada vendedor.</p>

                    <h2 id="responsabilidad">7. Responsabilidad</h2>
                    <p>ProviDent actúa como intermediario. No somos responsables por la calidad, seguridad o legalidad de los productos publicados ni por el cumplimiento entre comprador y vendedor, sin perjuicio de los derechos que la ley reconoce a los consumidores.</p>

                    <h2 id="consumidor">8. Derechos del consumidor</h2>
                    <p>Si comprás como consumidor final, te amparan la Ley 24.240 de Defensa del Consumidor y sus normas complementarias, incluido el derecho a revocar la compra dentro de los 10 días corridos desde la entrega. Podés iniciar un reclamo ante <a href="https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor" target="_blank" rel="noopener noreferrer">Defensa de las y los Consumidores</a>.</p>

                    <h2 id="cambios">9. Cambios en estos términos</h2>
                    <p>Podemos actualizar estos términos. Si el cambio es importante, te lo avisaremos en la plataforma. Para cualquier consulta, escribinos desde <RouterLink to="/soporte">Soporte</RouterLink>. Mirá también nuestra <RouterLink to="/privacidad">Política de privacidad</RouterLink>.</p>
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
