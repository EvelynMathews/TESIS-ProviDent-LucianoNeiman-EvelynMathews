<script>
/**
 * Propósito: Vista del perfil personal del usuario logueado.
 * Función: Centro de control del usuario: datos personales, contraseña, domicilios, compras,
 * estado de vendedor (cobros y publicaciones) y acciones de cuenta.
 * Cómo funciona: `loadProfile` carga en paralelo el perfil (`getUserProfileById`: nombre, avatar, bio y ubicación), el rol de vendedor,
 * la cuenta de cobro, los domicilios y los pedidos reales del usuario. Todo lo que se muestra viene de
 * Supabase; cuando no hay datos se muestra un estado vacío con la acción siguiente.
 */
import { logout, updatePassword, translateAuthError } from '../services/auth'
import { isCurrentUserSeller, hasPaymentAccount } from '../services/sellers'
import { supabase } from '../services/supabase'
import { listMyProducts, listProvinces } from '../services/products'
import { getUserProfileById } from '../services/user-profiles'
import { listMyAddresses, saveAddress, deleteAddress, setPrimaryAddress, listMyOrders } from '../services/addresses'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const EMPTY_ADDRESS = { id: null, recipient_name: '', street: '', city: '', province_id: '', postal_code: '', is_primary: false }

const ORDER_STATUS = {
    CREATED: { label: 'Pendiente de pago', cls: 'bg-amber-100 text-amber-900' },
    PAID: { label: 'Pagado', cls: 'bg-primary-50 text-primary-800' },
    FULFILLED: { label: 'Entregado', cls: 'bg-secondary-50 text-secondary-800' },
    CANCELED: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-700' },
}

export default {
    name: 'MyProfile',
    components: {
        LoadingSpinner
    },
    data() {
        return {
            userProfile: null,
            isSeller: false,
            hasPayment: false,
            myProducts: [],
            addresses: [],
            addressesError: '',
            provinces: [],
            orders: [],
            loading: true,
            loadError: '',
            showPasswordChange: false,
            newPassword: '',
            confirmPassword: '',
            passwordMessage: '',
            passwordMessageType: '',
            passwordSaving: false,
            deleteAccountMessage: '',
            showAddressEdit: false,
            editingAddress: { ...EMPTY_ADDRESS },
            addressError: '',
            addressSaving: false,
            addressNotice: '',
        }
    },
    computed: {
        initials() {
            const p = this.userProfile
            return ((p?.name?.[0] || '') + (p?.lastName?.[0] || '')).toUpperCase() || '?'
        }
    },
    methods: {
        async handleLogout() {
            await logout()
            this.$router.push('/')
        },
        async loadProfile() {
            this.loading = true
            this.loadError = ''
            try {
                const { data: me } = await supabase.auth.getUser()
                const uid = me?.user?.id
                if (!uid) {
                    this.$router.replace({ path: '/login', query: { redirect: '/mi-perfil' } })
                    return
                }

                const [data, isSeller, hasPayment, orders, provinces] = await Promise.all([
                    getUserProfileById(uid),
                    isCurrentUserSeller(),
                    hasPaymentAccount(),
                    listMyOrders(5),
                    listProvinces(),
                ])

                this.userProfile = {
                    name: data?.first_name || '',
                    lastName: data?.last_name || '',
                    email: me.user.email || '',
                    location: data?.location || '',
                    bio: data?.bio || '',
                    avatar_url: data?.avatar_url || '',
                }
                this.isSeller = isSeller
                this.hasPayment = hasPayment
                this.orders = orders
                this.provinces = provinces

                await this.loadAddresses()

                if (this.isSeller) {
                    try { this.myProducts = (await listMyProducts()).slice(0, 4) } catch { this.myProducts = [] }
                } else {
                    this.myProducts = []
                }
            } catch (error) {
                console.error('Error loading profile:', error)
                this.loadError = 'No pudimos cargar tu perfil. Revisá tu conexión e intentá de nuevo.'
            } finally {
                this.loading = false
            }
        },
        async loadAddresses() {
            this.addressesError = ''
            try {
                this.addresses = await listMyAddresses()
            } catch (e) {
                this.addresses = []
                this.addressesError = 'No pudimos cargar tus domicilios.'
            }
        },
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price || 0)
        },
        formatDate(value) {
            return value ? new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
        },
        orderStatus(status) {
            return ORDER_STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-700' }
        },
        productPrice(p) {
            if (p.product_type === 'PROSTHESIS') return 'Precio según trabajo'
            if (p.product_type === 'RENTAL') return `$${this.formatPrice(p.price_day)}/día`
            return `$${this.formatPrice(p.price)}`
        },
        cancelPasswordChange() {
            this.showPasswordChange = false
            this.newPassword = ''
            this.confirmPassword = ''
            this.passwordMessage = ''
        },
        async changePassword() {
            this.passwordMessage = ''
            if (this.newPassword.length < 6) {
                this.passwordMessage = 'La contraseña debe tener al menos 6 caracteres.'
                this.passwordMessageType = 'error'
                return
            }
            if (this.newPassword !== this.confirmPassword) {
                this.passwordMessage = 'Las contraseñas no coinciden.'
                this.passwordMessageType = 'error'
                return
            }
            this.passwordSaving = true
            try {
                await updatePassword(this.newPassword)
                this.passwordMessage = 'Listo, tu contraseña se actualizó.'
                this.passwordMessageType = 'success'
                this.newPassword = ''
                this.confirmPassword = ''
                setTimeout(() => this.cancelPasswordChange(), 2500)
            } catch (error) {
                this.passwordMessage = translateAuthError(error?.message)
                this.passwordMessageType = 'error'
            } finally {
                this.passwordSaving = false
            }
        },
        deleteAccount() {
            this.deleteAccountMessage = 'Por tu seguridad, la eliminación de cuentas se procesa a mano. Escribinos desde Soporte y la gestionamos.'
        },
        // --- Domicilios ---
        openAddressForm(address = null) {
            this.addressError = ''
            this.editingAddress = address
                ? { ...EMPTY_ADDRESS, ...address }
                : { ...EMPTY_ADDRESS, is_primary: this.addresses.length === 0, recipient_name: `${this.userProfile?.name || ''} ${this.userProfile?.lastName || ''}`.trim() }
            this.showAddressEdit = true
            this._lastFocus = document.activeElement
            this.$nextTick(() => this.$refs.firstAddressField?.focus())
        },
        closeAddressForm() {
            this.showAddressEdit = false
            this.$nextTick(() => this._lastFocus?.focus?.())
        },
        async submitAddress() {
            const a = this.editingAddress
            if (!a.street.trim() || !a.city.trim() || !a.province_id) {
                this.addressError = 'Completá calle, ciudad y provincia.'
                return
            }
            this.addressSaving = true
            this.addressError = ''
            try {
                await saveAddress(a)
                await this.loadAddresses()
                this.addressNotice = a.id ? 'Domicilio actualizado.' : 'Domicilio agregado.'
                this.closeAddressForm()
            } catch (e) {
                console.error('Error saving address:', e)
                this.addressError = 'No pudimos guardar el domicilio. Intentá de nuevo.'
            } finally {
                this.addressSaving = false
            }
        },
        async removeAddress(address) {
            if (!confirm('¿Eliminar este domicilio?')) return
            try {
                await deleteAddress(address.id)
                await this.loadAddresses()
                this.addressNotice = 'Domicilio eliminado.'
            } catch (e) {
                // Un domicilio usado en un pedido no se puede borrar (restricción de la base)
                this.addressNotice = 'No se puede eliminar un domicilio que ya se usó en un pedido.'
            }
        },
        async makePrimary(address) {
            try {
                await setPrimaryAddress(address.id)
                await this.loadAddresses()
                this.addressNotice = 'Domicilio principal actualizado.'
            } catch {
                this.addressNotice = 'No pudimos cambiar el domicilio principal.'
            }
        },
        onKeydown(e) {
            if (e.key === 'Escape' && this.showAddressEdit) this.closeAddressForm()
        }
    },
    mounted() {
        document.addEventListener('keydown', this.onKeydown)
        this.loadProfile()
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.onKeydown)
    }
}
</script>

<template>
    <section class="min-h-screen pb-16 relative overflow-hidden" style="background-color: #F5FEFF;">
        <div class="organic-shape organic-shape-1"></div>
        <div class="organic-shape organic-shape-2"></div>
        <div class="organic-shape organic-shape-3"></div>
        <div class="organic-shape organic-shape-4"></div>
        <div class="organic-shape organic-shape-5"></div>
        <div class="organic-shape organic-shape-6"></div>

        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
            <LoadingSpinner v-if="loading" message="Cargando tu perfil..." />

            <div v-else-if="loadError" class="bg-white rounded-xl border border-red-200 p-8 text-center" role="alert">
                <p class="text-red-800 font-semibold mb-4">{{ loadError }}</p>
                <button type="button" @click="loadProfile" class="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600">Reintentar</button>
            </div>

            <div v-else-if="userProfile" class="space-y-6">
                <!-- Encabezado -->
                <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div class="h-24 sm:h-28" style="background: linear-gradient(135deg, #C7DDF1 0%, #D4F4EC 55%, #F3DDD3 100%);"></div>
                    <div class="px-6 pb-6">
                        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 -mt-12">
                            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex-shrink-0 border-4 border-white bg-primary-50 shadow-sm">
                                <img v-if="userProfile.avatar_url" :src="userProfile.avatar_url" alt="Tu foto de perfil" class="w-full h-full object-cover" @error="userProfile.avatar_url = ''" />
                                <div v-else class="w-full h-full flex items-center justify-center text-3xl font-bold text-primary" aria-hidden="true">
                                    {{ initials }}
                                </div>
                            </div>

                            <div class="flex-1 text-center sm:text-left min-w-0 sm:pt-14">
                                <h1 class="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-1 break-words">
                                    {{ userProfile.name }} {{ userProfile.lastName }}
                                </h1>
                                <p class="text-gray-600 m-0 break-all">{{ userProfile.email }}</p>
                                <div class="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                                    <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-50 text-primary-800">Comprador</span>
                                    <span v-if="isSeller" class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-secondary-50 text-secondary-800">Vendedor</span>
                                </div>
                            </div>

                            <RouterLink to="/mi-perfil/editar"
                                class="inline-flex items-center gap-2 h-11 px-5 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition sm:mt-16">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.536 9 17l.464-3.536z" /></svg>
                                Editar perfil
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <!-- Invitación a vender -->
                <div v-if="!isSeller" class="rounded-2xl p-6 sm:p-8 border border-accent-200 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left" style="background-color: #F9EEE9;">
                    <div class="flex-1">
                        <h2 class="font-heading text-xl font-bold text-gray-800 mb-1">¿Querés vender en ProviDent?</h2>
                        <p class="text-gray-700 m-0">Activá tu cuenta de vendedor y publicá insumos, prótesis o alquileres.</p>
                    </div>
                    <RouterLink to="/seller-setup"
                        class="inline-flex items-center h-12 px-6 bg-accent-700 text-white font-semibold rounded-lg hover:bg-accent-800 transition whitespace-nowrap">
                        Empezar a vender
                    </RouterLink>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Datos personales -->
                    <div class="bg-white rounded-2xl border border-gray-200 p-6">
                        <h2 class="font-heading text-xl font-bold text-gray-800 mb-4">Datos personales</h2>
                        <dl class="space-y-4">
                            <div>
                                <dt class="text-sm text-gray-600">Nombre completo</dt>
                                <dd class="font-semibold text-gray-800 m-0">{{ userProfile.name }} {{ userProfile.lastName }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm text-gray-600">Email</dt>
                                <dd class="font-semibold text-gray-800 m-0 break-all">{{ userProfile.email }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm text-gray-600">Ubicación</dt>
                                <dd class="m-0" :class="userProfile.location ? 'font-semibold text-gray-800' : 'text-gray-600'">
                                    {{ userProfile.location || 'Sin completar' }}
                                    <RouterLink v-if="!userProfile.location" to="/mi-perfil/editar" class="ml-1 text-sm font-semibold text-primary-700 hover:underline">Agregar</RouterLink>
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm text-gray-600">Sobre vos</dt>
                                <dd class="m-0 whitespace-pre-line" :class="userProfile.bio ? 'text-gray-800' : 'text-gray-600'">{{ userProfile.bio || 'Sin completar' }}<RouterLink v-if="!userProfile.bio" to="/mi-perfil/editar" class="ml-2 text-sm font-semibold text-primary-700 hover:underline">Agregar</RouterLink></dd>
                            </div>
                        </dl>

                        <div class="mt-6 pt-5 border-t border-gray-100">
                            <h3 class="text-base font-semibold text-gray-800 mb-3">Contraseña</h3>
                            <button v-if="!showPasswordChange" type="button" @click="showPasswordChange = true"
                                class="h-10 px-4 text-sm font-semibold border-2 border-primary text-primary rounded-lg hover:bg-primary-50 transition">
                                Cambiar contraseña
                            </button>
                            <form v-else class="space-y-3" @submit.prevent="changePassword">
                                <div>
                                    <label for="new-password" class="field-label">Nueva contraseña</label>
                                    <input id="new-password" v-model="newPassword" type="password" autocomplete="new-password" minlength="6" class="field-input" aria-describedby="new-password-hint" />
                                    <p id="new-password-hint" class="field-hint">Mínimo 6 caracteres.</p>
                                </div>
                                <div>
                                    <label for="confirm-new-password" class="field-label">Repetí la contraseña</label>
                                    <input id="confirm-new-password" v-model="confirmPassword" type="password" autocomplete="new-password" minlength="6" class="field-input" />
                                </div>
                                <p v-if="passwordMessage" class="text-sm font-semibold m-0" :class="passwordMessageType === 'success' ? 'text-secondary-800' : 'text-red-700'" role="status">
                                    {{ passwordMessage }}
                                </p>
                                <div class="flex gap-2">
                                    <button type="submit" :disabled="passwordSaving"
                                        class="h-10 px-4 text-sm bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-50">
                                        {{ passwordSaving ? 'Guardando…' : 'Guardar contraseña' }}
                                    </button>
                                    <button type="button" @click="cancelPasswordChange"
                                        class="h-10 px-4 text-sm text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Domicilios -->
                    <div class="bg-white rounded-2xl border border-gray-200 p-6">
                        <div class="flex items-center justify-between gap-3 mb-4">
                            <h2 class="font-heading text-xl font-bold text-gray-800 m-0">Domicilios</h2>
                            <button v-if="addresses.length" type="button" @click="openAddressForm()"
                                class="h-10 px-4 text-sm font-semibold border-2 border-primary text-primary rounded-lg hover:bg-primary-50 transition">
                                Agregar
                            </button>
                        </div>

                        <p v-if="addressNotice" class="mb-3 text-sm text-secondary-800 bg-secondary-50 rounded-lg px-3 py-2" role="status">{{ addressNotice }}</p>
                        <p v-if="addressesError" class="mb-3 text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2" role="alert">{{ addressesError }}</p>

                        <ul v-if="addresses.length" class="space-y-3">
                            <li v-for="a in addresses" :key="a.id" class="p-4 rounded-xl border" :class="a.is_primary ? 'border-primary-200 bg-primary-50/50' : 'border-gray-200'">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <p v-if="a.is_primary" class="text-xs font-semibold text-primary-800 mb-1">Principal</p>
                                        <p class="font-semibold text-gray-800 m-0 break-words">{{ a.street }}</p>
                                        <p class="text-sm text-gray-600 m-0">{{ a.city }}{{ a.province_name ? `, ${a.province_name}` : '' }}{{ a.postal_code ? ` · CP ${a.postal_code}` : '' }}</p>
                                        <p v-if="a.recipient_name" class="text-sm text-gray-600 m-0">Recibe: {{ a.recipient_name }}</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm font-semibold">
                                    <button type="button" @click="openAddressForm(a)" class="text-primary-700 hover:underline">Editar</button>
                                    <button v-if="!a.is_primary" type="button" @click="makePrimary(a)" class="text-primary-700 hover:underline">Usar como principal</button>
                                    <button type="button" @click="removeAddress(a)" class="text-red-700 hover:underline">Eliminar</button>
                                </div>
                            </li>
                        </ul>

                        <div v-else-if="!addressesError" class="text-center py-6">
                            <p class="text-gray-600 mb-4">Todavía no cargaste ningún domicilio. Lo vas a necesitar para recibir tus pedidos.</p>
                            <button type="button" @click="openAddressForm()"
                                class="h-11 px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                                Agregar domicilio
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Compras -->
                    <div class="bg-white rounded-2xl border border-gray-200 p-6">
                        <h2 class="font-heading text-xl font-bold text-gray-800 mb-4">Mis compras</h2>
                        <ul v-if="orders.length" class="space-y-3">
                            <li v-for="order in orders" :key="order.id" class="p-4 border border-gray-200 rounded-xl flex items-start justify-between gap-3">
                                <div>
                                    <p class="font-semibold text-gray-800 m-0">Pedido del {{ formatDate(order.created_at) }}</p>
                                    <p class="text-sm text-gray-600 m-0">{{ order.items_count }} {{ order.items_count === 1 ? 'artículo' : 'artículos' }} · <span class="tabular-nums">${{ formatPrice(order.total_amount) }}</span></p>
                                </div>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap" :class="orderStatus(order.status).cls">
                                    {{ orderStatus(order.status).label }}
                                </span>
                            </li>
                        </ul>
                        <div v-else class="text-center py-6">
                            <p class="text-gray-600 mb-4">Todavía no hiciste compras. Cuando el pago online esté disponible, tus pedidos van a aparecer acá.</p>
                            <RouterLink to="/productos" class="inline-flex h-11 items-center px-5 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition">
                                Ver catálogo
                            </RouterLink>
                        </div>
                    </div>

                    <!-- Vendedor -->
                    <div v-if="isSeller" class="bg-white rounded-2xl border border-gray-200 p-6">
                        <div class="flex items-center justify-between gap-3 mb-4">
                            <h2 class="font-heading text-xl font-bold text-gray-800 m-0">Mis publicaciones</h2>
                            <RouterLink to="/mis-productos" class="text-sm font-semibold text-primary-700 hover:underline">Ver todas</RouterLink>
                        </div>

                        <p class="text-sm mb-4 px-3 py-2 rounded-lg" :class="hasPayment ? 'bg-secondary-50 text-secondary-800' : 'bg-amber-50 text-amber-900'">
                            <template v-if="hasPayment">Cuenta de cobro conectada.</template>
                            <template v-else>Falta conectar tu cuenta de cobro. <RouterLink to="/seller-setup" class="font-semibold underline">Conectala ahora</RouterLink></template>
                        </p>

                        <ul v-if="myProducts.length" class="divide-y divide-gray-100">
                            <li v-for="p in myProducts" :key="p.id" class="py-3 flex items-center gap-3">
                                <img :src="p.image || '/placeholder-product.svg'" alt="" class="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <RouterLink :to="`/productos/${p.id}`" class="font-semibold text-gray-800 truncate block hover:underline">{{ p.name }}</RouterLink>
                                    <p class="text-xs text-gray-600 m-0">{{ productPrice(p) }} · <span :class="p.is_active ? 'text-secondary-800' : 'text-gray-600'">{{ p.is_active ? 'Activa' : 'Pausada' }}</span></p>
                                </div>
                                <RouterLink :to="`/productos/${p.id}/editar`" class="text-sm font-semibold text-primary-700 hover:underline">Editar</RouterLink>
                            </li>
                        </ul>
                        <div v-else class="text-center py-4">
                            <p class="text-gray-600 mb-4">Todavía no publicaste nada.</p>
                            <RouterLink to="/publicar" class="inline-flex h-11 items-center px-5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                                Crear publicación
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <!-- Cuenta -->
                <div class="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 class="font-heading text-xl font-bold text-gray-800 mb-4">Cuenta</h2>
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button type="button" @click="handleLogout"
                            class="h-11 px-5 border-2 border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-50 transition">
                            Cerrar sesión
                        </button>
                        <button type="button" @click="deleteAccount" class="text-sm font-semibold text-red-700 hover:underline self-start sm:self-auto">
                            Quiero eliminar mi cuenta
                        </button>
                    </div>
                    <p v-if="deleteAccountMessage" class="mt-4 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2" role="status">
                        {{ deleteAccountMessage }} <RouterLink to="/chat" class="font-semibold text-primary-700 underline">Ir a Soporte</RouterLink>
                    </p>
                </div>
            </div>
        </div>

        <!-- Formulario de domicilio -->
        <div v-if="showAddressEdit" class="fixed inset-0 bg-gray-900/50 flex items-end sm:items-center justify-center z-50 sm:p-4" @click.self="closeAddressForm">
            <form role="dialog" aria-modal="true" aria-labelledby="address-dialog-title" @submit.prevent="submitAddress"
                class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-6 max-h-[90dvh] overflow-y-auto">
                <h2 id="address-dialog-title" class="text-xl font-bold text-gray-800 mb-4">{{ editingAddress.id ? 'Editar domicilio' : 'Nuevo domicilio' }}</h2>
                <div class="space-y-4">
                    <div>
                        <label for="addr-recipient" class="field-label">Quién recibe</label>
                        <input id="addr-recipient" ref="firstAddressField" v-model="editingAddress.recipient_name" type="text" autocomplete="name" class="field-input" />
                    </div>
                    <div>
                        <label for="addr-street" class="field-label">Calle y número</label>
                        <input id="addr-street" v-model="editingAddress.street" type="text" autocomplete="street-address" required class="field-input" placeholder="Ej: Av. Santa Fe 1234, piso 3" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="addr-city" class="field-label">Ciudad</label>
                            <input id="addr-city" v-model="editingAddress.city" type="text" autocomplete="address-level2" required class="field-input" />
                        </div>
                        <div>
                            <label for="addr-zip" class="field-label">Código postal</label>
                            <input id="addr-zip" v-model="editingAddress.postal_code" type="text" autocomplete="postal-code" class="field-input" />
                        </div>
                    </div>
                    <div>
                        <label for="addr-province" class="field-label">Provincia</label>
                        <select id="addr-province" v-model="editingAddress.province_id" required class="field-input">
                            <option value="" disabled>Elegí una provincia</option>
                            <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                    </div>
                    <label class="flex items-center gap-3 text-sm text-gray-800">
                        <input type="checkbox" v-model="editingAddress.is_primary" class="w-5 h-5 rounded border-gray-300 text-primary" />
                        Usar como domicilio principal
                    </label>
                    <p v-if="addressError" class="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2 m-0" role="alert">{{ addressError }}</p>
                </div>
                <div class="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    <button type="button" @click="closeAddressForm"
                        class="h-11 px-5 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit" :disabled="addressSaving"
                        class="h-11 px-5 font-semibold text-white bg-primary rounded-lg hover:bg-primary-600 transition disabled:opacity-60">
                        {{ addressSaving ? 'Guardando…' : 'Guardar domicilio' }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>

<style scoped>
.organic-shape {
    position: absolute;
    border-radius: 50% 40% 60% 50%;
    opacity: 0.6;
    z-index: 0;
}

.organic-shape-1 {
    width: 500px;
    height: 500px;
    background: #A4C5DF;
    top: 100px;
    right: -100px;
    animation: float 20s ease-in-out infinite;
}

.organic-shape-2 {
    width: 700px;
    height: 700px;
    background: #D4F4EC;
    bottom: -200px;
    left: -150px;
    border-radius: 60% 50% 40% 60%;
    animation: float 25s ease-in-out infinite reverse;
}

.organic-shape-3 {
    width: 400px;
    height: 400px;
    background: #F8E8E2;
    top: 50%;
    left: -100px;
    border-radius: 40% 60% 50% 40%;
    animation: float 30s ease-in-out infinite;
}

.organic-shape-4 {
    width: 350px;
    height: 350px;
    background: #E3EEF8;
    top: 30%;
    right: 10%;
    border-radius: 55% 45% 60% 40%;
    animation: float 22s ease-in-out infinite;
}

.organic-shape-5 {
    width: 600px;
    height: 600px;
    background: #A4C5DF;
    bottom: -250px;
    right: -200px;
    border-radius: 45% 55% 40% 60%;
    animation: float 28s ease-in-out infinite reverse;
}

.organic-shape-6 {
    width: 300px;
    height: 300px;
    background: #D4F4EC;
    top: 70%;
    right: -80px;
    border-radius: 50% 50% 45% 55%;
    animation: float 35s ease-in-out infinite;
}

@keyframes float {
    0%, 100% {
        transform: translate(0, 0) rotate(0deg);
    }
    33% {
        transform: translate(30px, -30px) rotate(5deg);
    }
    66% {
        transform: translate(-20px, 20px) rotate(-5deg);
    }
}

</style>
