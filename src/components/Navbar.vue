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
import BrandLogo from './BrandLogo.vue';

export default {
    name: 'Navbar',
    components: {
        MiniCart,
        BrandLogo
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
                <BrandLogo class="w-10 h-10 -my-1 text-primary" />
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
                        <p v-if="user.email" class="px-4 pb-2 mb-1 border-b border-gray-100 text-xs text-gray-600 truncate">{{ user.email }}</p>
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
