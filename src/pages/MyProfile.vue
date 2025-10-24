<script>
import { subscribeToAuthStateChanges, logout } from '../services/auth'

export default {
    name: 'MyProfile',
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
            },
            userProfile: {
                name: 'Dr. Juan Pérez',
                lastName: 'Pérez',
                email: 'juan.perez@example.com',
                phone: '+54 11 4567-8901',
                avatar_url: null,
                roles: ['Comprador', 'Vendedor']
            },
            addresses: [
                {
                    id: 1,
                    street: 'Av. Corrientes 1234',
                    city: 'CABA',
                    province: 'Buenos Aires',
                    postal_code: 'C1043',
                    country: 'Argentina',
                    is_primary: true
                }
            ],
            bankAccounts: [
                {
                    id: 1,
                    bank_name: 'Banco Galicia',
                    account_holder: 'Juan Pérez',
                    account_number: '1234-567890/1',
                    cbu: '0070123430000005678901',
                    alias: 'juan.perez.dental'
                }
            ],
            recentPurchases: [
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
            ],
            recentSales: [
                {
                    id: 'SALE-001',
                    buyer_name: 'Dra. María González',
                    date: '2025-01-14',
                    product: 'Resina Compuesta Flow A2',
                    amount: 18500,
                    status: 'paid'
                }
            ],
            myPublications: [
                {
                    id: 1,
                    title: 'Resina Compuesta Flow A2',
                    type: 'product',
                    image: 'https://placehold.co/100x100/2A6FAF/ffffff?text=Resina',
                    price: 18500,
                    status: 'active'
                },
                {
                    id: 101,
                    title: 'Corona de Zirconio',
                    type: 'service',
                    image: 'https://placehold.co/100x100/29A68C/ffffff?text=Corona',
                    price: 45000,
                    status: 'active'
                }
            ],
            isSeller: true,
            showPasswordChange: false,
            newPassword: '',
            confirmPassword: ''
        }
    },
    computed: {
        primaryAddress() {
            return this.addresses.find(addr => addr.is_primary) || this.addresses[0]
        }
    },
    methods: {
        handleLogout() {
            logout()
            this.$router.push('/login')
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
                'pending': '#DC8C73',
                'in_progress': '#2A6FAF',
                'delivered': '#29A68C',
                'cancelled': '#DC2626',
                'active': '#29A68C',
                'paused': '#F59E0B',
                'finished': '#6B7280',
                'paid': '#29A68C'
            }
            return colors[status] || '#6B7280'
        },
        goToPublish() {
            this.$router.push('/publicar')
        },
        changePassword() {
            if (this.newPassword === this.confirmPassword) {
                alert('Contraseña cambiada exitosamente')
                this.showPasswordChange = false
                this.newPassword = ''
                this.confirmPassword = ''
            } else {
                alert('Las contraseñas no coinciden')
            }
        },
        deleteAccount() {
            if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                alert('Cuenta eliminada')
                this.handleLogout()
            }
        }
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState
        })
    }
}
</script>

<template>
    <section class="pt-20 bg-gray-50 min-h-screen pb-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="h-32" style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 50%, #DC8C73 100%);"></div>
                <div class="px-6 pb-6">
                    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16">
                        <div class="w-32 h-32 rounded-full overflow-hidden shadow-lg flex-shrink-0 border-4 border-white" style="background-color: #E3EEF8;">
                            <img v-if="userProfile.avatar_url" :src="userProfile.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-4xl font-bold" style="color: #2A6FAF;">
                                {{ userProfile.name.charAt(0) }}{{ userProfile.lastName.charAt(0) }}
                            </div>
                        </div>

                        <div class="flex-1 text-center sm:text-left mt-6">
                            <h1 class="font-heading text-3xl font-bold text-gray-800 mb-2">
                                {{ userProfile.name }} {{ userProfile.lastName }}
                            </h1>
                            <div class="flex flex-wrap gap-2 justify-center sm:justify-start mb-2">
                                <span v-for="role in userProfile.roles" :key="role"
                                    class="px-3 py-1 text-sm font-semibold rounded-full text-white shadow-md"
                                    style="background: linear-gradient(135deg, #2A6FAF 0%, #29A68C 100%);">
                                    {{ role }}
                                </span>
                            </div>
                            <p class="text-gray-600">{{ userProfile.email }}</p>
                        </div>

                        <button @click="goToEditProfile"
                            class="mt-6 px-6 py-2 bg-white border-2 font-semibold rounded-lg transition hover:bg-gray-50 shadow-md"
                            style="color: #2A6FAF; border-color: #2A6FAF;">
                            Editar datos personales
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="!isSeller" class="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg shadow-md p-8 mb-6 border-2" style="border-color: #2A6FAF;">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background-color: #2A6FAF;">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        </svg>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-gray-800 mb-2">¿Querés empezar a vender en ProviDent?</h2>
                    <p class="text-gray-600 mb-6">Completá tus datos de cobro y elegí qué tipo de oferta querés publicar.</p>
                    <button @click="goToPublish"
                        class="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition"
                        style="background-color: #2A6FAF;">
                        Quiero ser vendedor
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="p-4" style="background: linear-gradient(135deg, #E3EEF8 0%, #D4F4EC 100%);">
                        <h2 class="font-heading text-xl font-bold flex items-center gap-2" style="color: #2A6FAF;">
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
                            <button v-if="!showPasswordChange" @click="showPasswordChange = true"
                                class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50"
                                style="color: #2A6FAF; border-color: #2A6FAF;">
                                Cambiar contraseña
                            </button>
                            <div v-else class="space-y-3">
                                <input v-model="newPassword" type="password" placeholder="Nueva contraseña"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                                    style="focus:ring-color: #2A6FAF;" />
                                <input v-model="confirmPassword" type="password" placeholder="Confirmar contraseña"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                                    style="focus:ring-color: #2A6FAF;" />
                                <div class="flex gap-2">
                                    <button @click="changePassword"
                                        class="px-4 py-2 text-sm text-white font-semibold rounded-lg transition hover:opacity-90"
                                        style="background-color: #2A6FAF;">
                                        Guardar
                                    </button>
                                    <button @click="showPasswordChange = false; newPassword = ''; confirmPassword = ''"
                                        class="px-4 py-2 text-sm text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="p-4" style="background: linear-gradient(135deg, #D4F4EC 0%, #F8E8E2 100%);">
                        <h2 class="font-heading text-xl font-bold flex items-center gap-2" style="color: #29A68C;">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                            </svg>
                            Domicilios
                        </h2>
                    </div>
                    <div class="p-6">
                    <div v-if="primaryAddress" class="mb-4 p-4 rounded-lg bg-gray-50">
                        <p class="text-sm font-semibold text-gray-600 mb-2">Dirección principal</p>
                        <p class="text-gray-800 font-semibold">{{ primaryAddress.street }}</p>
                        <p class="text-gray-600 text-sm">{{ primaryAddress.city }}, {{ primaryAddress.province }}</p>
                        <p class="text-gray-600 text-sm">CP: {{ primaryAddress.postal_code }} - {{ primaryAddress.country }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50"
                            style="color: #2A6FAF; border-color: #2A6FAF;">
                            Editar
                        </button>
                        <button class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50"
                            style="color: #29A68C; border-color: #29A68C;">
                            Agregar nuevo domicilio
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            <div v-if="isSeller" class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="p-4" style="background: linear-gradient(135deg, #F8E8E2 0%, #E3EEF8 100%);">
                    <h2 class="font-heading text-xl font-bold flex items-center gap-2" style="color: #DC8C73;">
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
                    <button class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50"
                        style="color: #2A6FAF; border-color: #2A6FAF;">
                        Editar cuenta principal
                    </button>
                    <button class="px-4 py-2 text-sm font-semibold border-2 rounded-lg transition hover:bg-gray-50"
                        style="color: #29A68C; border-color: #29A68C;">
                        Agregar otra cuenta
                    </button>
                </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="font-heading text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                        <span class="flex items-center gap-2">
                            <svg class="w-6 h-6" style="color: #2A6FAF;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                            </svg>
                            Últimas compras
                        </span>
                        <RouterLink to="/mis-compras" class="text-sm font-semibold hover:underline" style="color: #2A6FAF;">
                            Ver historial
                        </RouterLink>
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
                                    :style="{backgroundColor: getStatusColor(purchase.status)}">
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
                            <svg class="w-6 h-6" style="color: #29A68C;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
                            </svg>
                            Últimas ventas
                        </span>
                        <RouterLink to="/mis-ventas" class="text-sm font-semibold hover:underline" style="color: #29A68C;">
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
                                    :style="{backgroundColor: getStatusColor(sale.status)}">
                                    {{ getStatusText(sale.status) }}
                                </span>
                            </div>
                            <p class="font-bold" style="color: #29A68C;">${{ formatPrice(sale.amount) }}</p>
                        </div>
                        <div v-if="recentSales.length === 0" class="text-center py-8 text-gray-500">
                            <p>No hay ventas recientes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isSeller" class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="font-heading text-xl font-bold text-gray-800 flex items-center gap-2">
                        <svg class="w-6 h-6" style="color: #2A6FAF;" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                        </svg>
                        Mis publicaciones
                    </h2>
                    <button @click="goToPublish"
                        class="px-4 py-2 text-sm text-white font-semibold rounded-lg transition hover:opacity-90"
                        style="background-color: #29A68C;">
                        Publicar nuevo producto o servicio
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="publication in myPublications" :key="publication.id"
                        class="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                        <img :src="publication.image" :alt="publication.title" class="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <p class="font-semibold text-gray-800">{{ publication.title }}</p>
                                    <p class="text-sm text-gray-600 capitalize">{{ publication.type === 'product' ? 'Producto' : 'Servicio' }}</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full text-white"
                                    :style="{backgroundColor: getStatusColor(publication.status)}">
                                    {{ getStatusText(publication.status) }}
                                </span>
                            </div>
                            <p class="font-bold mb-2" style="color: #29A68C;">${{ formatPrice(publication.price) }}</p>
                            <div class="flex gap-2">
                                <button class="text-xs px-3 py-1 font-semibold border rounded-lg hover:bg-gray-50"
                                    style="color: #2A6FAF; border-color: #2A6FAF;">
                                    Editar
                                </button>
                                <button class="text-xs px-3 py-1 font-semibold text-red-600 border border-red-600 rounded-lg hover:bg-red-50">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="font-heading text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6" style="color: #2A6FAF;" fill="currentColor" viewBox="0 0 20 20">
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
                        <button @click="deleteAccount"
                            class="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-8 flex justify-center">
                <button @click="handleLogout"
                    class="px-8 py-3 border-2 font-semibold rounded-lg hover:bg-gray-50 transition"
                    style="color: #2A6FAF; border-color: #2A6FAF;">
                    Cerrar sesión
                </button>
            </div>
        </div>
    </section>
</template>
