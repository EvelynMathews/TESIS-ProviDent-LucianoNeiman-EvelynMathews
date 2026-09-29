<script>
/**
 * Propósito: Vista del perfil personal del usuario logueado.
 * Función: Servir como el centro de control del usuario, mostrando datos personales, roles, direcciones, cuentas bancarias (mock), un resumen de actividad (compras/ventas) y productos publicados.
 * Cómo funciona: `loadProfile` carga el perfil completo, verifica el rol de vendedor (`isCurrentUserSeller`) y carga el avatar firmado desde Storage. La data es poblada a través de `userProfile` y otros arrays de mock. Ofrece navegación a la edición de perfil y manejo de acciones de cuenta como cambio de contraseña y eliminación de cuenta.
 */
import { subscribeToAuthStateChanges, logout, deleteOwnAccount } from '../services/auth'
import { isCurrentUserSeller } from '../services/sellers'
import { supabase } from '../services/supabase'
import { listMyProducts, listProvinces } from '../services/products'
import { getPrimaryAddress, savePrimaryAddress } from '../services/addresses'
import { showToast } from '../services/toast'
import { SUPPORT } from '../config/support'
import { getCached, setCached } from '../services/cache'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

export default {
    name: 'MyProfile',
    components: {
        LoadingSpinner,
        ConfirmModal
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
            },
            userProfile: null,
            address: null,
            provinces: [],
            bankAccounts: [],
            recentPurchases: [],
            recentSales: [],

            isSeller: false,
            sellerMessage: '',
            myProducts: [],
            loading: true,
            showAddressEdit: false,
            addressForm: { id: null, street: '', city: '', province_id: '', postal_code: '' },
            addressError: '',
            savingAddress: false,
            showDeleteAccount: false,
            deletingAccount: false
        }
    },
    methods: {
        async handleLogout() {
            logout()
            this.$router.push('/login')
        },
        async loadProfile() {
            try {
                this.loading = true
                const { data: me } = await supabase.auth.getUser()
                const uid = me?.user?.id
                if (!uid) return

                this.loadAddress(uid)

                const cacheKey = `profile:${uid}`
                const cached = getCached(cacheKey)

                if (cached) {
                    this.userProfile = cached.userProfile
                    this.isSeller = cached.isSeller
                    this.myProducts = cached.myProducts
                    this.bankAccounts = cached.bankAccounts
                    this.recentPurchases = cached.recentPurchases
                    this.recentSales = cached.recentSales
                    this.loading = false

                    if (cached.avatarPath) {
                        try {
                            const { data: signed, error } = await supabase.storage.from('avatars').createSignedUrl(cached.avatarPath, 60 * 60)
                            if (!error && signed?.signedUrl) {
                                this.userProfile.avatar_url = signed.signedUrl
                            }
                        } catch (e) {
                            console.warn('Avatar URL generation failed', e?.message || e)
                        }
                    }
                    return
                }

                const { data } = await supabase.from('public_user_profiles').select('*').eq('id', uid).single()

                this.userProfile = {
                    name: data?.first_name || '',
                    lastName: data?.last_name || '',
                    email: me.user.email || '',
                    phone: data?.phone || null,
                    avatar_url: null,
                    roles: []
                }

                const avatarPath = data?.avatar_url || null

                if (avatarPath) {
                    try {
                        const { data: signed, error } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 60 * 60)
                        if (!error && signed?.signedUrl) {
                            this.userProfile.avatar_url = signed.signedUrl
                        } else {
                            const dl = await supabase.storage.from('avatars').download(avatarPath)
                            if (!dl.error && dl.data) {
                                this.userProfile.avatar_url = URL.createObjectURL(dl.data)
                            }
                        }
                    } catch (e) {
                        console.warn('Avatar URL generation failed', e?.message || e)
                        this.userProfile.avatar_url = null
                    }
                }

                this.isSeller = await isCurrentUserSeller()
                this.userProfile.roles = ['Comprador'].concat(this.isSeller ? ['Vendedor'] : [])

                if (this.isSeller) {
                    try { this.myProducts = (await listMyProducts()).slice(0, 4) } catch (e) { this.myProducts = [] }
                } else {
                    this.myProducts = []
                }

                this.bankAccounts = [
                    {
                        id: 1,
                        bank_name: 'Banco Galicia',
                        account_holder: `${this.userProfile.name} ${this.userProfile.lastName}`,
                        account_number: '1234-567890/1',
                        cbu: '0070123430000005678901',
                        alias: 'juan.perez.dental'
                    }
                ]

                this.recentPurchases = [
                    {
                        id: 'ORD-001',
                        date: '2025-01-15',
                        total: 63500,
                        status: 'delivered',
                        items_count: 2
                    },
                    {
                        id: 'ORD-002',
                        date: '2025-01-10',
                        total: 45000,
                        status: 'in_progress',
                        items_count: 1
                    }
                ]

                this.recentSales = [
                    {
                        id: 'SALE-001',
                        buyer_name: 'Dra. María González',
                        date: '2025-01-14',
                        product: 'Resina Compuesta Flow A2',
                        amount: 18500,
                        status: 'paid'
                    }
                ]

                setCached(cacheKey, {
                    userProfile: {
                        ...this.userProfile,
                        avatar_url: null
                    },
                    avatarPath,
                    isSeller: this.isSeller,
                    myProducts: this.myProducts,
                    bankAccounts: this.bankAccounts,
                    recentPurchases: this.recentPurchases,
                    recentSales: this.recentSales
                })
            } catch (error) {
                console.error('Error loading profile:', error)
            } finally {
                this.loading = false
            }
        },
        goToEditProfile() {
            this.$router.push('/mi-perfil/editar')
        },
        formatPrice(price) {
            return new Intl.NumberFormat('es-AR').format(price)
        },
        getStatusText(status) {
            const statuses = {
                'pending': 'Pendiente',
                'in_progress': 'En preparación',
                'delivered': 'Completado',
                'cancelled': 'Cancelado',
                'active': 'Activo',
                'paused': 'Pausado',
                'finished': 'Finalizado',
                'paid': 'Pagado'
            }
            return statuses[status] || status
        },
        getStatusColor(status) {
            const colors = {
                'pending': 'bg-accent',
                'in_progress': 'bg-primary',
                'delivered': 'bg-secondary',
                'cancelled': 'bg-red-600',
                'active': 'bg-secondary',
                'paused': 'bg-amber-500',
                'finished': 'bg-gray-500',
                'paid': 'bg-secondary'
            }
            return colors[status] || 'bg-gray-500'
        },
        goToPublish() {
            this.$router.push('/publicar')
        },
        async confirmDeleteAccount() {
            this.deletingAccount = true
            try {
                await deleteOwnAccount()
                window.location.href = '/'
            } catch (error) {
                this.showDeleteAccount = false
                if (error.message === 'has_orders') {
                    showToast(`Tenés pedidos o ventas registrados, por eso no podemos eliminar tu cuenta todavía. Finalizá o cancelá tus pedidos, o escribí a ${SUPPORT.email} y lo hacemos por vos.`, 'error', 10000)
                } else {
                    showToast(error.message, 'error', 6000)
                }
            } finally {
                this.deletingAccount = false
            }
        },
        async loadAddress(uid) {
            try {
                this.address = await getPrimaryAddress(uid)
            } catch (error) {
                console.error('Error al cargar el domicilio:', error)
            }
        },
        async editAddress() {
            this.addressError = ''
            this.addressForm = {
                id: this.address?.id || null,
                street: this.address?.street || '',
                city: this.address?.city || '',
                province_id: this.address?.province_id || '',
                postal_code: this.address?.postal_code || ''
            }
            this.showAddressEdit = true
            if (this.provinces.length === 0) {
                this.provinces = await listProvinces()
            }
        },
        async saveAddress() {
            this.addressError = ''
            if (!this.addressForm.city.trim() || !this.addressForm.province_id) {
                this.addressError = 'Completá la ciudad y la provincia'
                return
            }
            try {
                this.savingAddress = true
                await savePrimaryAddress(this.user.id, this.addressForm)
                await this.loadAddress(this.user.id)
                this.showAddressEdit = false
                showToast('Domicilio guardado correctamente')
            } catch (error) {
                console.error('Error al guardar el domicilio:', error)
                this.addressError = 'No se pudo guardar el domicilio. Intentá de nuevo más tarde.'
            } finally {
                this.savingAddress = false
            }
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
            this.loadProfile()
        })
    }
}
</script>

<template>
    <section class="pt-20 min-h-screen pb-12 relative overflow-hidden bg-surface">
        <div class="organic-shape organic-shape-1"></div>
        <div class="organic-shape organic-shape-2"></div>
        <div class="organic-shape organic-shape-3"></div>
        <div class="organic-shape organic-shape-4"></div>
        <div class="organic-shape organic-shape-5"></div>
        <div class="organic-shape organic-shape-6"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <LoadingSpinner v-if="loading" message="Cargando perfil..." />

            <div v-else>
                <div v-if="sellerMessage" class="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700">
                    {{ sellerMessage }}
                </div>
                <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="h-32 bg-linear-135 from-primary-soft via-secondary-soft to-accent-soft"></div>
                <div class="px-6 pb-6">
                    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16">
                        <div class="w-32 h-32 rounded-full overflow-hidden shadow-lg flex-shrink-0 border-4 border-white bg-primary-50">
                            <img v-if="userProfile.avatar_url" :src="userProfile.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-4xl font-bold text-primary">
                                {{ userProfile.name.charAt(0) }}{{ userProfile.lastName.charAt(0) }}
                            </div>
                        </div>

                        <div class="flex-1 text-center sm:text-left mt-6">
                            <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">
                                {{ userProfile.name }} {{ userProfile.lastName }}
                            </h1>
                            <div class="flex flex-wrap gap-2 justify-center sm:justify-start mb-2">
                                <span v-for="role in userProfile.roles" :key="role"
                                    class="px-3 py-1 text-sm font-semibold rounded-full text-white shadow-md bg-linear-135 from-primary to-secondary">
                                    {{ role }}
                                </span>
                            </div>
                            <p class="text-gray-600">{{ userProfile.email }}</p>
                        </div>

                        <button @click="goToEditProfile"
                            class="mt-6 px-6 py-2 bg-white border-2 font-semibold rounded-lg transition hover:bg-gray-50 shadow-md text-primary border-primary">
                            Editar datos personales
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="!isSeller" class="rounded-lg shadow-md p-8 mb-6 border-2 bg-accent-soft border-accent">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-accent">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        </svg>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">¿Querés empezar a vender en ProviDent?</h2>
                    <p class="text-gray-600 mb-6">Configurá tu perfil de vendedor para comenzar a publicar productos.</p>
                    <RouterLink to="/seller-setup"
                        class="inline-block px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition bg-accent">
                        Quiero ser vendedor
                    </RouterLink>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="p-4 bg-primary-50">
                        <h2 class="font-heading text-xl font-bold flex items-center gap-2 text-primary">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                            </svg>
                            Datos personales
                        </h2>
                    </div>
                    <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <p class="text-sm text-gray-600">Nombre completo</p>
                            <p class="font-semibold text-gray-800">{{ userProfile.name }} {{ userProfile.lastName }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Correo electrónico</p>
                            <p class="font-semibold text-gray-800">{{ userProfile.email }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Teléfono</p>
                            <p class="font-semibold text-gray-800">{{ userProfile.phone || 'No especificado' }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600 mb-2">Contraseña</p>
                            <RouterLink to="/mi-perfil/editar#cambiar-contrasena"
                                class="inline-block px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50 text-primary border-primary">
                                Cambiar contraseña
                            </RouterLink>
                        </div>
                    </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="p-4 bg-secondary-soft">
                        <h2 class="font-heading text-xl font-bold flex items-center gap-2 text-secondary">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                            </svg>
                            Domicilios
                        </h2>
                    </div>
                    <div class="p-6">
                    <div v-if="address" class="mb-4 p-4 rounded-lg bg-gray-50">
                        <p class="text-sm font-semibold text-gray-600 mb-2">Dirección principal</p>
                        <p class="text-gray-800 font-semibold">{{ address.street || 'Sin calle cargada' }}</p>
                        <p class="text-gray-600 text-sm">{{ address.city }}, {{ address.province }}</p>
                        <p v-if="address.postal_code" class="text-gray-600 text-sm">CP: {{ address.postal_code }}</p>
                    </div>
                    <p v-else class="mb-4 text-sm text-gray-500">Todavía no cargaste un domicilio.</p>
                    <div class="flex gap-2">
                        <button @click="editAddress"
                            class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50 text-primary border-primary">
                            {{ address ? 'Editar' : 'Agregar domicilio' }}
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            <div v-if="isSeller" class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="p-4 bg-accent-soft">
                    <h2 class="font-heading text-xl font-bold flex items-center gap-2 text-accent">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                            <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path>
                        </svg>
                        Información bancaria
                    </h2>
                </div>
                <div class="p-6">
                <div v-for="account in bankAccounts" :key="account.id" class="mb-4 p-4 rounded-lg bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Banco</p>
                            <p class="font-semibold text-gray-800">{{ account.bank_name }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Titular</p>
                            <p class="font-semibold text-gray-800">{{ account.account_holder }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">CBU</p>
                            <p class="font-semibold text-gray-800">{{ account.cbu }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Alias</p>
                            <p class="font-semibold text-gray-800">{{ account.alias }}</p>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50 text-primary border-primary">
                        Editar cuenta principal
                    </button>
                    <button class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50 text-secondary border-secondary">
                        Agregar otra cuenta
                    </button>
                </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="font-heading text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        </svg>
                        Últimas compras
                    </h2>
                    <div class="space-y-3">
                        <div v-for="purchase in recentPurchases" :key="purchase.id"
                            class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <p class="font-semibold text-gray-800">{{ purchase.id }}</p>
                                    <p class="text-sm text-gray-600">{{ purchase.date }} • {{ purchase.items_count }} artículos</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full text-white"
                                    :class="getStatusColor(purchase.status)">
                                    {{ getStatusText(purchase.status) }}
                                </span>
                            </div>
                            <p class="font-bold text-gray-800">${{ formatPrice(purchase.total) }}</p>
                        </div>
                        <div v-if="recentPurchases.length === 0" class="text-center py-8 text-gray-500">
                            <p>No hay compras recientes</p>
                        </div>
                    </div>
                </div>

                <div v-if="isSeller" class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="font-heading text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                        <span class="flex items-center gap-2">
                            <svg class="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
                            </svg>
                            Últimas ventas
                        </span>
                        <RouterLink to="/mis-productos" class="text-sm font-semibold hover:underline text-secondary">
                            Ver todas
                        </RouterLink>
                    </h2>
                    <div class="space-y-3">
                        <div v-for="sale in recentSales" :key="sale.id"
                            class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <p class="font-semibold text-gray-800">{{ sale.buyer_name }}</p>
                                    <p class="text-sm text-gray-600">{{ sale.product }}</p>
                                    <p class="text-sm text-gray-600">{{ sale.date }}</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full text-white"
                                    :class="getStatusColor(sale.status)">
                                    {{ getStatusText(sale.status) }}
                                </span>
                            </div>
                            <p class="font-bold text-secondary">${{ formatPrice(sale.amount) }}</p>
                        </div>
                        <div v-if="recentSales.length === 0" class="text-center py-8 text-gray-500">
                            <p>No hay ventas recientes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isSeller && myProducts.length" class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="font-heading text-xl font-bold text-gray-800 flex items-center gap-2">
                        <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                        </svg>
                        Mis productos
                    </h2>
                    <RouterLink to="/mis-productos"
                        class="px-4 py-2 text-sm text-white font-semibold rounded-lg transition hover:opacity-90 bg-secondary">
                        Ver todos
                    </RouterLink>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div v-for="p in myProducts" :key="p.id"
                        class="border border-gray-200 rounded-lg overflow-hidden">
                        <img :src="p.image || 'https://placehold.co/600x400?text=Producto'" class="w-full h-28 object-cover" alt="mi-producto"/>
                        <div class="p-3">
                            <p class="font-semibold text-gray-800 truncate">{{ p.name }}</p>
                            <p class="text-xs text-gray-600 truncate">${{ formatPrice(p.price) }} · {{ p.unit || 'unidad' }}</p>
                            <RouterLink :to="`/productos/${p.id}`" class="text-xs text-sky-600 hover:underline">Ver</RouterLink>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="font-heading text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                    </svg>
                    Configuración de cuenta
                </h2>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                        <div>
                            <p class="font-semibold text-red-600">Eliminar cuenta</p>
                            <p class="text-sm text-red-600">Esta acción no se puede deshacer</p>
                        </div>
                        <button @click="showDeleteAccount = true"
                            class="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-8 flex justify-center">
                <button @click="handleLogout"
                    class="px-8 py-3 border-2 font-semibold rounded-lg hover:bg-gray-50 transition text-primary border-primary">
                    Cerrar sesión
                </button>
            </div>
            </div>
        </div>

        <div v-if="showAddressEdit" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            @click.self="showAddressEdit = false">
            <form @submit.prevent="saveAddress" class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
                <h3 id="address-modal-title" class="font-heading text-xl font-bold text-gray-800 mb-4">
                    {{ addressForm.id ? 'Editar domicilio' : 'Agregar domicilio' }}
                </h3>
                <div v-if="addressError" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p class="text-red-600 text-sm font-semibold">{{ addressError }}</p>
                </div>
                <div class="space-y-4">
                    <div>
                        <label for="address-street" class="block text-sm font-semibold text-gray-700 mb-1">Calle y número</label>
                        <input id="address-street" v-model="addressForm.street" type="text" placeholder="Ej: Av. Corrientes 1234"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="address-city" class="block text-sm font-semibold text-gray-700 mb-1">Ciudad *</label>
                            <input id="address-city" v-model="addressForm.city" type="text" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                        </div>
                        <div>
                            <label for="address-province" class="block text-sm font-semibold text-gray-700 mb-1">Provincia *</label>
                            <select id="address-province" v-model="addressForm.province_id" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-primary">
                                <option value="" disabled>Seleccioná</option>
                                <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label for="address-postal" class="block text-sm font-semibold text-gray-700 mb-1">Código postal</label>
                        <input id="address-postal" v-model="addressForm.postal_code" type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                    </div>
                </div>
                <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button type="button" @click="showAddressEdit = false"
                        class="px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
                        Cancelar
                    </button>
                    <button type="submit" :disabled="savingAddress"
                        class="px-5 py-2.5 rounded-lg font-semibold text-white bg-primary hover:opacity-90 transition disabled:opacity-50">
                        {{ savingAddress ? 'Guardando...' : 'Guardar' }}
                    </button>
                </div>
            </form>
        </div>

        <ConfirmModal v-if="showDeleteAccount"
            title="Eliminar cuenta"
            message="Se van a borrar tu perfil, tus productos publicados, tu carrito y tus domicilios. Esta acción no se puede deshacer."
            confirm-text="Eliminar mi cuenta"
            :loading="deletingAccount"
            @confirm="confirmDeleteAccount"
            @cancel="showDeleteAccount = false" />
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

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
