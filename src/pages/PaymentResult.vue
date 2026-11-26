<script>
/**
 * Propósito: Pantalla a la que vuelve el comprador después de pagar en Mercado Pago.
 * Cómo funciona: Toma el pedido de la URL (`?orden=` o `external_reference`) o, si no viene,
 * el último pedido en curso guardado en el navegador. Nunca confía en el `status` de la URL:
 * pregunta el estado real con `verifyPayment` (Edge Function `verify-payment`). Si el pago
 * quedó pendiente, vuelve a consultar cada pocos segundos durante un rato.
 * Estados: verificando, aprobado, pendiente, sin pagar, rechazado, cancelado y error.
 */
import { verifyPayment, getPendingOrder, clearPendingOrder } from '../services/checkout'
import { syncCartWithSupabase } from '../services/cart'
import { formatMoney } from '../services/format'

const POLL_MS = 6000
const MAX_POLLS = 20 // ~2 minutos

const REJECTION_REASONS = {
    cc_rejected_insufficient_amount: 'La tarjeta no tiene saldo suficiente.',
    cc_rejected_bad_filled_security_code: 'El código de seguridad de la tarjeta es incorrecto.',
    cc_rejected_bad_filled_date: 'La fecha de vencimiento de la tarjeta es incorrecta.',
    cc_rejected_bad_filled_card_number: 'El número de tarjeta es incorrecto.',
    cc_rejected_bad_filled_other: 'Algún dato de la tarjeta es incorrecto.',
    cc_rejected_call_for_authorize: 'Tenés que autorizar el pago con el banco emisor de tu tarjeta.',
    cc_rejected_card_disabled: 'La tarjeta está deshabilitada. Llamá a tu banco para activarla.',
    cc_rejected_duplicated_payment: 'Ya hiciste un pago igual hace un momento.',
    cc_rejected_high_risk: 'Mercado Pago rechazó el pago por seguridad.',
    cc_rejected_max_attempts: 'Superaste la cantidad de intentos permitidos con esta tarjeta.',
    cc_rejected_invalid_installments: 'La tarjeta no acepta esa cantidad de cuotas.',
}

const PENDING_REASONS = {
    pending_contingency: 'Mercado Pago está procesando el pago. Suele tardar unos minutos.',
    pending_review_manual: 'Mercado Pago está revisando el pago. Te avisamos cuando se acredite.',
    pending_waiting_payment: 'Falta que pagues en el punto de pago que elegiste.',
    pending_waiting_transfer: 'Falta que completes la transferencia.',
}

export default {
    name: 'PaymentResult',
    data() {
        return {
            state: 'checking', // checking | approved | pending | unpaid | rejected | canceled | not-found | error
            result: null,
            orderId: null,
            resumeUrl: null,
            polls: 0,
            errorMessage: '',
        }
    },
    computed: {
        shortOrder() {
            return this.orderId ? this.orderId.slice(0, 8).toUpperCase() : ''
        },
        totalLabel() {
            return this.result ? formatMoney(this.result.total) : ''
        },
        rejectionReason() {
            return REJECTION_REASONS[this.result?.status_detail] || 'El medio de pago no fue aprobado.'
        },
        pendingReason() {
            return PENDING_REASONS[this.result?.status_detail] || 'Mercado Pago todavía no confirmó el pago. Te avisamos apenas se acredite.'
        },
        heading() {
            return {
                checking: 'Estamos confirmando tu pago…',
                approved: '¡Listo, tu pago fue aprobado!',
                pending: 'Tu pago está en proceso',
                unpaid: 'Todavía no recibimos tu pago',
                rejected: 'El pago no se pudo completar',
                canceled: 'Este pedido fue cancelado',
                'not-found': 'No encontramos un pago en curso',
                error: 'No pudimos confirmar el pago',
            }[this.state]
        }
    },
    methods: {
        async check() {
            try {
                const paymentId = this.$route.query.payment_id || this.$route.query.collection_id || null
                const result = await verifyPayment(this.orderId, paymentId)
                this.result = result
                this.applyResult(result)
            } catch (e) {
                if (e.code === 'ORDER_NOT_FOUND') {
                    clearPendingOrder()
                    this.state = 'not-found'
                } else if (e.code === 'UNAUTHORIZED') {
                    this.$router.replace({ path: '/login', query: { redirect: this.$route.fullPath } })
                } else {
                    this.state = 'error'
                    this.errorMessage = e.message
                }
            }
        },
        applyResult(r) {
            if (r.order_status === 'PAID' || r.payment_status === 'APPROVED') {
                this.state = 'approved'
                clearPendingOrder()
                syncCartWithSupabase() // el servidor ya quitó lo comprado del carrito
                return
            }
            if (r.order_status === 'CANCELED') {
                this.state = 'canceled'
                clearPendingOrder()
                return
            }
            if (r.payment_status === 'REJECTED') {
                this.state = 'rejected'
                return
            }
            this.state = r.awaiting_payment ? 'unpaid' : 'pending'
            if (this.state === 'pending') this.schedulePoll()
        },
        schedulePoll() {
            clearTimeout(this._timer)
            if (this.polls >= MAX_POLLS) return
            this._timer = setTimeout(() => {
                this.polls++
                this.check()
            }, POLL_MS)
        },
        retryCheck() {
            this.state = 'checking'
            this.polls = 0
            this.check()
        }
    },
    mounted() {
        const q = this.$route.query
        const pending = getPendingOrder()
        this.orderId = q.orden || q.external_reference || pending?.orderId || null
        this.resumeUrl = pending && pending.orderId === this.orderId ? pending.checkoutUrl : null
        if (!this.orderId) {
            this.state = 'not-found'
            return
        }
        this.check()
    },
    beforeUnmount() {
        clearTimeout(this._timer)
    },
    watch: {
        heading(value) {
            if (value) document.title = `${value} · ProviDent`
        }
    }
}
</script>

<template>
    <section class="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 flex items-start sm:items-center justify-center">
        <div class="w-full max-w-lg">
            <div class="bg-white rounded-2xl border border-gray-200 shadow-[0_12px_32px_-16px_rgba(18,45,70,0.25)] p-6 sm:p-8 text-center"
                role="status" aria-live="polite" :aria-busy="state === 'checking'">

                <!-- Ícono de estado -->
                <div class="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" aria-hidden="true"
                    :class="{
                        'bg-primary-50 text-primary': ['checking', 'pending', 'unpaid', 'not-found'].includes(state),
                        'bg-secondary-50 text-secondary-700': state === 'approved',
                        'bg-red-50 text-red-700': ['rejected', 'error', 'canceled'].includes(state),
                    }">
                    <svg v-if="state === 'checking'" class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <svg v-else-if="state === 'approved'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else-if="['pending', 'unpaid'].includes(state)" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg v-else-if="state === 'not-found'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <h1 class="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{{ heading }}</h1>

                <!-- Verificando -->
                <p v-if="state === 'checking'" class="text-gray-600 m-0">Consultamos a Mercado Pago. No cierres esta página.</p>

                <!-- Aprobado -->
                <template v-else-if="state === 'approved'">
                    <p class="text-gray-600 mb-6">Le avisamos a los vendedores. Te van a contactar para coordinar el envío.</p>
                    <dl class="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                        <div class="flex justify-between gap-3"><dt class="text-gray-600">Pedido</dt><dd class="m-0 font-semibold text-gray-800 tabular-nums">#{{ shortOrder }}</dd></div>
                        <div class="flex justify-between gap-3"><dt class="text-gray-600">Total pagado</dt><dd class="m-0 font-semibold text-gray-800 tabular-nums">{{ totalLabel }}</dd></div>
                        <div class="flex justify-between gap-3"><dt class="text-gray-600">Envío</dt><dd class="m-0 text-gray-800">A coordinar con el vendedor</dd></div>
                    </dl>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <RouterLink :to="`/mis-compras/${orderId}`" class="btn-primary">Ver detalle de la compra</RouterLink>
                        <RouterLink to="/productos" class="btn-secondary">Seguir comprando</RouterLink>
                    </div>
                </template>

                <!-- Pendiente (Mercado Pago está procesando) -->
                <template v-else-if="state === 'pending'">
                    <p class="text-gray-600 mb-2">{{ pendingReason }}</p>
                    <p class="text-sm text-gray-600 mb-6">Pedido #{{ shortOrder }} · {{ totalLabel }}. Podés cerrar esta página: el estado se actualiza solo en <RouterLink to="/mis-compras" class="font-semibold text-primary-700 underline">Mis compras</RouterLink>.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <button type="button" @click="retryCheck" class="btn-primary">Volver a consultar</button>
                        <RouterLink to="/productos" class="btn-secondary">Seguir comprando</RouterLink>
                    </div>
                </template>

                <!-- Sin pagar todavía -->
                <template v-else-if="state === 'unpaid'">
                    <p class="text-gray-600 mb-6">El pedido #{{ shortOrder }} ({{ totalLabel }}) está reservado, pero Mercado Pago todavía no registró ningún pago.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <a v-if="resumeUrl" :href="resumeUrl" class="btn-primary">Continuar el pago</a>
                        <RouterLink v-else to="/checkout" class="btn-primary">Ir a pagar</RouterLink>
                        <button type="button" @click="retryCheck" class="btn-secondary">Ya pagué, volver a consultar</button>
                    </div>
                </template>

                <!-- Rechazado -->
                <template v-else-if="state === 'rejected'">
                    <p class="text-gray-600 mb-2">{{ rejectionReason }}</p>
                    <p class="text-sm text-gray-600 mb-6">No se hizo ningún cobro. Tu carrito sigue guardado: podés intentar con otro medio de pago.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <RouterLink to="/checkout" class="btn-primary">Intentar de nuevo</RouterLink>
                        <RouterLink to="/carrito" class="btn-secondary">Ver carrito</RouterLink>
                    </div>
                </template>

                <!-- Cancelado -->
                <template v-else-if="state === 'canceled'">
                    <p class="text-gray-600 mb-6">Si pagaste, el dinero se devuelve al mismo medio de pago. Si tenés dudas, escribinos.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <RouterLink to="/soporte" class="btn-primary">Ir a Soporte</RouterLink>
                        <RouterLink to="/carrito" class="btn-secondary">Ver carrito</RouterLink>
                    </div>
                </template>

                <!-- Sin pedido -->
                <template v-else-if="state === 'not-found'">
                    <p class="text-gray-600 mb-6">Si acabás de pagar, revisá el estado en Mis compras. Si no, podés empezar desde tu carrito.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <RouterLink to="/mis-compras" class="btn-primary">Ver mis compras</RouterLink>
                        <RouterLink to="/carrito" class="btn-secondary">Ir al carrito</RouterLink>
                    </div>
                </template>

                <!-- Error -->
                <template v-else>
                    <p class="text-gray-600 mb-6">{{ errorMessage || 'Hubo un problema de conexión.' }} Si pagaste, no te preocupes: el pago queda registrado y lo vas a ver en Mis compras.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <button type="button" @click="retryCheck" class="btn-primary">Reintentar</button>
                        <RouterLink to="/mis-compras" class="btn-secondary">Ver mis compras</RouterLink>
                    </div>
                </template>
            </div>
        </div>
    </section>
</template>

<style scoped>
.btn-primary,
.btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    padding: 0 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background-color 0.15s;
}

.btn-primary {
    background: #2A6FAF;
    color: #fff;
}

.btn-primary:hover {
    background: #22598C;
}

.btn-secondary {
    border: 2px solid #2A6FAF;
    color: #2A6FAF;
}

.btn-secondary:hover {
    background: #E3EEF8;
}
</style>
