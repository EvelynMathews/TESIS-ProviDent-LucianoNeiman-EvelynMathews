<script>
/**
 * Componente de la barra de navegación superior.
 * Propósito: Proporcionar navegación principal, búsqueda, un indicador del carrito de compras y
 * acceso a la cuenta (login/registro vs. menú de usuario) según el estado de autenticación.
 * Funcionamiento: Se suscribe a los cambios de estado de autenticación (`subscribeToAuthStateChanges`)
 * para actualizar dinámicamente los enlaces. Muestra el conteo del carrito (`cartCount`)
 * y enlaces específicos para vendedores (`isSeller`). Los menús desplegables se cierran al
 * navegar, al hacer clic afuera o con la tecla Escape.
 */
import { logout, subscribeToAuthStateChanges } from '../services/auth';
import { isCurrentUserSeller } from '../services/sellers';
import { getCartCount, syncCartWithSupabase } from '../services/cart';
import { signedAvatarUrl } from '../services/user-profiles';
import { supabase } from '../services/supabase';
import MiniCart from './MiniCart.vue';

export default {
    name: 'Navbar',
    components: {
        MiniCart
    },
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
                avatar_url: null,
            },
            avatarUrl: null,
            mobileMenuOpen: false,
            accountMenuOpen: false,
            isSeller: false,
            showMiniCart: false,
            searchQuery: '',
            lastUserId: undefined,
        };
    },
    computed: {
        cartCount() {
            return getCartCount();
        },
        initials() {
            const name = this.user?.username || this.user?.email || ''
            const parts = String(name).trim().split(/\s+/)
            return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
        },
        firstName() {
            return (this.user?.first_name || this.user?.username || '').split(' ')[0] || 'Mi cuenta'
        }
    },
    watch: {
        '$route.fullPath'() {
            this.closeAll()
        },
        '$route.query.search': {
            immediate: true,
            handler(value) {
                this.searchQuery = value || ''
            }
        }
    },
    methods: {
        async handleLogout() {
            this.closeAll()
            await logout();
            this.$router.push('/');
        },
        async refreshSeller() {
            this.isSeller = this.user?.id ? await isCurrentUserSeller() : false;
        },
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            this.showMiniCart = false
            this.accountMenuOpen = false
        },
        toggleMiniCart() {
            this.showMiniCart = !this.showMiniCart;
            this.accountMenuOpen = false
        },
        toggleAccountMenu() {
            this.accountMenuOpen = !this.accountMenuOpen
            this.showMiniCart = false
        },
        closeAll() {
            this.mobileMenuOpen = false
            this.showMiniCart = false
            this.accountMenuOpen = false
        },
        handleClickOutside(event) {
            const cartEl = this.$refs.cartWrapper
            if (cartEl && !cartEl.contains(event.target)) this.showMiniCart = false
            const accountEl = this.$refs.accountWrapper
            if (accountEl && !accountEl.contains(event.target)) this.accountMenuOpen = false
        },
        handleKeydown(event) {
            if (event.key === 'Escape' && (this.showMiniCart || this.accountMenuOpen || this.mobileMenuOpen)) {
                this.closeAll()
            }
        },
        async loadAvatar() {
            const uid = this.user?.id
            if (!uid) {
                this.avatarUrl = null
                return
            }
            try {
                const { data } = await supabase.from('public_user_profiles').select('avatar_url').eq('id', uid).maybeSingle()
                this.avatarUrl = data?.avatar_url ? (await signedAvatarUrl(data.avatar_url)) || null : null
            } catch {
                this.avatarUrl = null
            }
        },
        handleSearch() {
            const q = this.searchQuery.trim()
            this.closeAll()
            this.$router.push(q ? { path: '/productos', query: { search: q } } : '/productos')
        },
    },
    async mounted() {
        this.unsubscribe = subscribeToAuthStateChanges(async (newUserState) => {
            this.user = newUserState;
            // Evita recargar todo cada vez que cambia un dato menor del perfil
            if (this.lastUserId === newUserState.id) return
            this.lastUserId = newUserState.id
            await Promise.all([this.refreshSeller(), this.loadAvatar(), syncCartWithSupabase()])
        });
        window.addEventListener('seller:changed', this.refreshSeller);
        document.addEventListener('click', this.handleClickOutside);
        document.addEventListener('keydown', this.handleKeydown);
    },
    beforeUnmount() {
        if (this.unsubscribe) this.unsubscribe()
        window.removeEventListener('seller:changed', this.refreshSeller);
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleKeydown);
    }
};
</script>

<template>
    <nav class="bg-white/95 backdrop-blur border-b border-gray-200 fixed top-0 left-0 right-0 z-50" aria-label="Navegación principal">
        <div class="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-4">
            <RouterLink to="/" class="flex items-center gap-2 shrink-0 rounded-lg" aria-label="ProviDent, ir al inicio">
                <svg class="w-10 h-10 -my-1" viewBox="150 100 190 200" aria-hidden="true">
                    <path fill="#2a6faf" d="M182.5,116.9c-4.7,2.2-9.9,7.4-11.4,11.4-1.7,4.5-1.3,12.4.8,16.6,2.6,5.1,8.3,9.9,12.6,10.7,6.1,1.1,13.1-.1,17.6-3,4.5-3,8.9-10.9,8.9-16.1,0-15.1-15.3-25.7-28.5-19.6Z"/>
                    <path fill="#2a6faf" d="M296.5,116.9c-8.4,3.8-13.2,12.4-12.1,21.5,1.2,10.3,9.4,17.6,19.9,17.6,9.1,0,15.8-4.3,19.2-12.2,6.9-16.7-10.7-34.3-27-26.9Z"/>
                    <path fill="#2a6faf" d="M212.5,155.9c-4.4,1.1-9,3.7-13,7.2-3.5,3.1-3.6,3.1-6.9,1.5-4.6-2.2-9.1-2-14.3.5-16.4,7.9-20.2,34.5-7.6,53.1,2.5,3.7,3.2,6.1,4.1,14.4,1.5,13.3,4.9,24.5,10.3,34,4.9,8.6,14.4,19,18.4,20,4.9,1.2,5.1-.8,1.1-11.1-2-5.3-4.3-12.6-5-16.3-1.6-7.3-3.1-22.2-2.4-22.2.3,0,1.9.5,3.6,1.1,2.7.9,3.2,1.6,3.7,5.7,2,17,5.1,28.7,9.5,35.6,4.9,7.7,10.9,10.1,17,6.8,5.1-2.8,6.8-6.5,8.4-18.3,2.2-15.6,6.1-23.2,10.1-19.9,2.1,1.7,5.2,12.2,6.5,22.1.6,4.6,1.8,9.5,2.6,11.1,3.2,6.3,11.3,8.1,17.1,4,3.8-2.7,9.5-13.8,11.8-22.7.8-3.3,2-9.8,2.5-14.4.5-4.7,1.3-8.8,1.7-9.1.5-.4,2.1-1,3.6-1.4l2.9-.7-.7,6.8c-1.1,11.8-2.6,18.5-6.2,28.8-1.9,5.5-3.6,10.9-3.6,12-.5,5.6,8.4.6,16-9.1,9.1-11.7,14.3-25.2,16.3-42,1-8.3,1.7-10.8,4.6-15.4,5.5-9.1,6.7-13.4,6.8-24.5,0-8.4-.3-10.8-2.3-15.2-2.7-6.2-9.2-12.5-14.6-14.3-4.4-1.5-11.2-.8-13.3,1.4-1.4,1.3-1.9,1.1-5.5-2-9.8-8.3-19.3-10-33.2-5.9-13.4,4-17.6,4.1-27.1,1.1-8.9-2.8-18.2-4-22.9-2.7ZM226.5,166.1c2.2.6,8.2,2.9,13.3,5.1,10.5,4.4,18.6,5.8,21.6,3.6,1.8-1.4,1.8-1.5-.3-3.5l-2.3-2.1,4.9-1.6c14.4-4.7,24-1.9,29.4,8.6,6.7,13.1,3.2,31.1-8.1,41-3.6,3.3-4,3.9-2,3.3,5-1.5,11.6-5.4,16.5-9.6,4.5-4,4.7-4.1,2.7-1.2-3.6,5-10.6,10.7-18.3,14.8-3.8,2-7.5,4.7-8,5.9-1.5,3.1.4,7.4,3.6,8.2,2.3.6,2.5,1,2,4.3-2.9,18-6.8,30.2-10.7,33.7-1.9,1.8-2,1.8-3.3,0-.8-1-1.7-4.4-2-7.5-1.8-15.1-6.3-27.4-11.5-31.1-3.6-2.6-9.9-2.6-13.2-.1-5.3,4.2-9,14.8-11.3,32.2-.3,2.6-1.2,5.5-2,6.5-1.3,1.8-1.4,1.8-3.4,0-3.5-3.2-9-20-10.6-32.4-.6-4.2-.4-5.2.8-5.2,2.5,0,4.9-3.6,4.5-7.1-.3-3-1-3.8-7.8-7.5-7.7-4.2-17.2-12-19.2-15.8-.7-1.3.7-.4,3.5,2.1,4.4,4,11.5,8.2,16.7,9.8,2,.6,1.6,0-2-3.3-7-6.1-10.3-13-10.8-22.5-.6-10.9,1-17.6,5.6-22.7,5.6-6.2,13.1-8.3,21.7-5.9Z"/>
                </svg>
                <span class="font-heading text-xl font-bold text-primary tracking-tight">ProviDent</span>
            </RouterLink>

            <form class="hidden md:block flex-1 max-w-xl" role="search" @submit.prevent="handleSearch">
                <label for="navbar-search" class="sr-only">Buscar en el catálogo</label>
                <div class="relative">
                    <svg class="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input id="navbar-search" v-model="searchQuery" type="search" enterkeyhint="search"
                        placeholder="Buscar productos y servicios"
                        class="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition">
                </div>
            </form>

            <div class="ml-auto flex items-center gap-1 md:gap-2">
                <div class="hidden lg:flex items-center gap-1">
                    <RouterLink to="/productos" class="nav-link inline-flex" active-class="nav-link-active">Catálogo</RouterLink>
                    <RouterLink v-if="user.id && isSeller" to="/publicar" class="nav-link inline-flex" active-class="nav-link-active">Publicar</RouterLink>
                    <RouterLink v-if="user.id" to="/chat" class="nav-link inline-flex" active-class="nav-link-active">Soporte</RouterLink>
                </div>

                <!-- Carrito: mini carrito en escritorio, enlace directo en móvil -->
                <div ref="cartWrapper" class="relative">
                    <button @click="toggleMiniCart" type="button"
                        class="hidden md:inline-flex icon-button"
                        :aria-expanded="showMiniCart" aria-haspopup="true" aria-controls="mini-cart"
                        :aria-label="cartCount ? `Carrito: ${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}` : 'Carrito vacío'">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span v-if="cartCount" aria-hidden="true" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
                    </button>
                    <RouterLink to="/carrito" class="inline-flex md:hidden icon-button"
                        :aria-label="cartCount ? `Carrito: ${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}` : 'Carrito'">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span v-if="cartCount" aria-hidden="true" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
                    </RouterLink>
                    <MiniCart v-if="showMiniCart" id="mini-cart" :logged-in="!!user.id" @close="showMiniCart = false" />
                </div>

                <!-- Visitante -->
                <template v-if="!user.id">
                    <RouterLink to="/login" class="hidden md:inline-flex nav-link">Ingresar</RouterLink>
                    <RouterLink to="/register"
                        class="hidden md:inline-flex items-center h-10 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">
                        Crear cuenta
                    </RouterLink>
                </template>

                <!-- Usuario logueado: menú de cuenta -->
                <div v-else ref="accountWrapper" class="relative hidden md:block">
                    <button type="button" @click="toggleAccountMenu"
                        class="flex items-center gap-2 h-10 pl-1 pr-2 rounded-full border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition"
                        :aria-expanded="accountMenuOpen" aria-haspopup="menu" aria-controls="account-menu">
                        <span class="w-8 h-8 rounded-full overflow-hidden bg-primary-50 text-primary text-xs font-bold flex items-center justify-center">
                            <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover" @error="avatarUrl = null" />
                            <span v-else aria-hidden="true">{{ initials }}</span>
                        </span>
                        <span class="text-sm font-medium text-gray-800 max-w-[8rem] truncate">{{ firstName }}</span>
                        <svg class="w-4 h-4 text-gray-500 transition-transform" :class="{ 'rotate-180': accountMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div v-if="accountMenuOpen" id="account-menu" role="menu"
                        class="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-gray-200 shadow-[0_12px_32px_-8px_rgba(18,45,70,0.25)] py-2 z-50">
                        <p class="px-4 pb-2 mb-1 border-b border-gray-100 text-xs text-gray-600 truncate">{{ user.email }}</p>
                        <RouterLink role="menuitem" to="/mi-perfil" class="menu-item">Mi perfil</RouterLink>
                        <RouterLink role="menuitem" to="/carrito" class="menu-item">Mi carrito</RouterLink>
                        <template v-if="isSeller">
                            <RouterLink role="menuitem" to="/mis-productos" class="menu-item">Mis publicaciones</RouterLink>
                            <RouterLink role="menuitem" to="/seller-setup" class="menu-item">Métodos de envío</RouterLink>
                        </template>
                        <RouterLink v-else role="menuitem" to="/seller-setup" class="menu-item">Empezar a vender</RouterLink>
                        <RouterLink role="menuitem" to="/chat" class="menu-item lg:hidden">Soporte</RouterLink>
                        <button role="menuitem" type="button" @click="handleLogout"
                            class="menu-item w-full text-left text-red-700 border-t border-gray-100 mt-1">
                            Cerrar sesión
                        </button>
                    </div>
                </div>

                <button @click="toggleMobileMenu" type="button"
                    :aria-expanded="mobileMenuOpen" aria-controls="mobile-menu"
                    :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
                    class="inline-flex md:hidden icon-button">
                    <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6L6 18"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Menú móvil -->
        <div v-show="mobileMenuOpen" id="mobile-menu" class="md:hidden border-t border-gray-200 bg-white max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div class="px-4 py-4 space-y-4">
                <form role="search" @submit.prevent="handleSearch">
                    <label for="mobile-search" class="sr-only">Buscar en el catálogo</label>
                    <div class="relative">
                        <svg class="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input id="mobile-search" v-model="searchQuery" type="search" enterkeyhint="search"
                            placeholder="Buscar productos y servicios"
                            class="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg text-base focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    </div>
                </form>

                <ul class="font-medium space-y-1">
                    <li><RouterLink to="/" class="mobile-link" exact-active-class="mobile-link-active">Inicio</RouterLink></li>
                    <li><RouterLink to="/productos" class="mobile-link" active-class="mobile-link-active">Catálogo</RouterLink></li>
                    <li><RouterLink to="/carrito" class="mobile-link" active-class="mobile-link-active">Carrito<span v-if="cartCount" class="ml-auto text-sm text-gray-600">{{ cartCount }}</span></RouterLink></li>
                    <template v-if="user.id">
                        <li><RouterLink to="/mi-perfil" class="mobile-link" active-class="mobile-link-active">Mi perfil</RouterLink></li>
                        <template v-if="isSeller">
                            <li><RouterLink to="/publicar" class="mobile-link" active-class="mobile-link-active">Publicar</RouterLink></li>
                            <li><RouterLink to="/mis-productos" class="mobile-link" active-class="mobile-link-active">Mis publicaciones</RouterLink></li>
                            <li><RouterLink to="/seller-setup" class="mobile-link" active-class="mobile-link-active">Métodos de envío</RouterLink></li>
                        </template>
                        <li v-else><RouterLink to="/seller-setup" class="mobile-link" active-class="mobile-link-active">Empezar a vender</RouterLink></li>
                        <li><RouterLink to="/chat" class="mobile-link" active-class="mobile-link-active">Soporte</RouterLink></li>
                    </template>
                </ul>

                <div v-if="!user.id" class="grid grid-cols-2 gap-3 pt-2">
                    <RouterLink to="/login"
                        class="h-12 flex items-center justify-center border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition">
                        Ingresar
                    </RouterLink>
                    <RouterLink to="/register"
                        class="h-12 flex items-center justify-center bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition">
                        Crear cuenta
                    </RouterLink>
                </div>
                <button v-else type="button" @click="handleLogout"
                    class="w-full h-12 border border-gray-300 rounded-lg text-red-700 font-semibold hover:bg-red-50 transition">
                    Cerrar sesión
                </button>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.nav-link {
    align-items: center;
    height: 2.5rem;
    padding: 0 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    transition: color 0.15s, background-color 0.15s;
}
.nav-link:hover { color: #22598C; background-color: #E3EEF8; }
.nav-link-active { color: #22598C; background-color: #E3EEF8; }

.icon-button {
    position: relative;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 9999px;
    color: #374151;
    transition: color 0.15s, background-color 0.15s;
}
.icon-button:hover { color: #22598C; background-color: #E3EEF8; }

.cart-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.125rem;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.3rem;
    border-radius: 9999px;
    background: #22598C;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.25rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 0 0 2px #fff;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    color: #1F2937;
    transition: background-color 0.15s;
}
.menu-item:hover, .menu-item:focus-visible { background-color: #E3EEF8; }

.mobile-link {
    display: flex;
    align-items: center;
    min-height: 3rem;
    padding: 0 0.75rem;
    border-radius: 0.5rem;
    color: #1F2937;
}
.mobile-link:hover { background-color: #F3F4F6; }
.mobile-link-active { color: #22598C; background-color: #E3EEF8; }
</style>
