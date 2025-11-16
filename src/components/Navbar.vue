<script>
import { logout, subscribeToAuthStateChanges } from '../services/auth';
import { isCurrentUserSeller } from '../services/sellers';
import { getCartCount } from '../services/cart';
import { supabase } from '../services/supabase';

export default {
    name: 'Navbar',
    data() {
        return {
            user: {
                id: null,
                email: null,
                username: null,
                avatar_url: null,
            },
            mobileMenuOpen: false,
            isSeller: false,
        };
    },
    computed: {
        cartCount() {
            return getCartCount();
        }
    },
    methods: {
        handleLogout() {
            logout();
            this.$router.push('/login');
        },
        async refreshSeller() {
            this.isSeller = this.user?.id ? await isCurrentUserSeller() : false;
        },
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
        },
        async loadAvatar() {
            const uid = this.user?.id;
            if (!uid) {
                this.user.avatar_url = null;
                return;
            }

            try {
                const { data } = await supabase.from('public_user_profiles').select('avatar_url').eq('id', uid).single();
                if (data?.avatar_url) {
                    const { data: signed, error } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_url, 60 * 60);
                    if (!error && signed?.signedUrl) {
                        this.user.avatar_url = signed.signedUrl;
                    } else {
                        const dl = await supabase.storage.from('avatars').download(data.avatar_url);
                        if (!dl.error && dl.data) {
                            this.user.avatar_url = URL.createObjectURL(dl.data);
                        }
                    }
                } else {
                    this.user.avatar_url = null;
                }
            } catch (e) {
                console.warn('Avatar loading failed', e?.message || e);
                this.user.avatar_url = null;
            }
        },
    },
    mounted() {
        subscribeToAuthStateChanges(async (newUserState) => {
            this.user = newUserState;
            await this.refreshSeller();
            await this.loadAvatar();
        });
        try {
            window.addEventListener('seller:changed', this.refreshSeller);
        } catch {}
    },
    beforeUnmount() {
        try { window.removeEventListener('seller:changed', this.refreshSeller); } catch {}
    }
};
</script>

<template>
    <nav class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 py-3">
            <RouterLink to="/" class="flex items-center space-x-3">
                <svg class="w-20 h-20" viewBox="0 0 484 492">
                    <path fill="#2a6faf" d="M182.5,116.9c-4.7,2.2-9.9,7.4-11.4,11.4-1.7,4.5-1.3,12.4.8,16.6,2.6,5.1,8.3,9.9,12.6,10.7,6.1,1.1,13.1-.1,17.6-3,4.5-3,8.9-10.9,8.9-16.1,0-15.1-15.3-25.7-28.5-19.6Z"/>
                    <path fill="#2a6faf" d="M296.5,116.9c-8.4,3.8-13.2,12.4-12.1,21.5,1.2,10.3,9.4,17.6,19.9,17.6,9.1,0,15.8-4.3,19.2-12.2,6.9-16.7-10.7-34.3-27-26.9Z"/>
                    <path fill="#2a6faf" d="M212.5,155.9c-4.4,1.1-9,3.7-13,7.2-3.5,3.1-3.6,3.1-6.9,1.5-4.6-2.2-9.1-2-14.3.5-16.4,7.9-20.2,34.5-7.6,53.1,2.5,3.7,3.2,6.1,4.1,14.4,1.5,13.3,4.9,24.5,10.3,34,4.9,8.6,14.4,19,18.4,20,4.9,1.2,5.1-.8,1.1-11.1-2-5.3-4.3-12.6-5-16.3-1.6-7.3-3.1-22.2-2.4-22.2.3,0,1.9.5,3.6,1.1,2.7.9,3.2,1.6,3.7,5.7,2,17,5.1,28.7,9.5,35.6,4.9,7.7,10.9,10.1,17,6.8,5.1-2.8,6.8-6.5,8.4-18.3,2.2-15.6,6.1-23.2,10.1-19.9,2.1,1.7,5.2,12.2,6.5,22.1.6,4.6,1.8,9.5,2.6,11.1,3.2,6.3,11.3,8.1,17.1,4,3.8-2.7,9.5-13.8,11.8-22.7.8-3.3,2-9.8,2.5-14.4.5-4.7,1.3-8.8,1.7-9.1.5-.4,2.1-1,3.6-1.4l2.9-.7-.7,6.8c-1.1,11.8-2.6,18.5-6.2,28.8-1.9,5.5-3.6,10.9-3.6,12-.5,5.6,8.4.6,16-9.1,9.1-11.7,14.3-25.2,16.3-42,1-8.3,1.7-10.8,4.6-15.4,5.5-9.1,6.7-13.4,6.8-24.5,0-8.4-.3-10.8-2.3-15.2-2.7-6.2-9.2-12.5-14.6-14.3-4.4-1.5-11.2-.8-13.3,1.4-1.4,1.3-1.9,1.1-5.5-2-9.8-8.3-19.3-10-33.2-5.9-13.4,4-17.6,4.1-27.1,1.1-8.9-2.8-18.2-4-22.9-2.7ZM226.5,166.1c2.2.6,8.2,2.9,13.3,5.1,10.5,4.4,18.6,5.8,21.6,3.6,1.8-1.4,1.8-1.5-.3-3.5l-2.3-2.1,4.9-1.6c14.4-4.7,24-1.9,29.4,8.6,6.7,13.1,3.2,31.1-8.1,41-3.6,3.3-4,3.9-2,3.3,5-1.5,11.6-5.4,16.5-9.6,4.5-4,4.7-4.1,2.7-1.2-3.6,5-10.6,10.7-18.3,14.8-3.8,2-7.5,4.7-8,5.9-1.5,3.1.4,7.4,3.6,8.2,2.3.6,2.5,1,2,4.3-2.9,18-6.8,30.2-10.7,33.7-1.9,1.8-2,1.8-3.3,0-.8-1-1.7-4.4-2-7.5-1.8-15.1-6.3-27.4-11.5-31.1-3.6-2.6-9.9-2.6-13.2-.1-5.3,4.2-9,14.8-11.3,32.2-.3,2.6-1.2,5.5-2,6.5-1.3,1.8-1.4,1.8-3.4,0-3.5-3.2-9-20-10.6-32.4-.6-4.2-.4-5.2.8-5.2,2.5,0,4.9-3.6,4.5-7.1-.3-3-1-3.8-7.8-7.5-7.7-4.2-17.2-12-19.2-15.8-.7-1.3.7-.4,3.5,2.1,4.4,4,11.5,8.2,16.7,9.8,2,.6,1.6,0-2-3.3-7-6.1-10.3-13-10.8-22.5-.6-10.9,1-17.6,5.6-22.7,5.6-6.2,13.1-8.3,21.7-5.9Z"/>
                </svg>
                <span class="text-2xl font-bold hover:opacity-80 transition hidden sm:block" style="color: #2A6FAF;">
                    ProviDent
                </span>
            </RouterLink>

            <div class="hidden md:flex flex-1 max-w-2xl mx-8">
                <div class="w-full relative">
                    <input type="text"
                        placeholder="Buscar productos, marcas o proveedores..."
                        class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                    <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <RouterLink to="/carrito" class="relative text-gray-700 hover:text-sky-600 transition hidden md:block">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span class="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style="background-color: #2A6FAF;">{{ cartCount }}</span>
                </RouterLink>

                <button @click="toggleMobileMenu" type="button"
                    class="inline-flex items-center p-2 w-10 h-10 justify-center text-gray-700 rounded-lg md:hidden hover:bg-gray-100">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
                    </svg>
                </button>

                <div class="hidden md:flex items-center gap-4">
                    <template v-if="user.id === null">
                        <RouterLink to="/productos"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition"
                            active-class="text-sky-600">
                            Productos
                        </RouterLink>
                        <RouterLink to="/login"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition">
                            Ingresar
                        </RouterLink>
                        <RouterLink to="/register"
                            class="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">
                            Registrarse
                        </RouterLink>
                    </template>

                    <template v-else>
                        <RouterLink to="/productos"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition"
                            active-class="text-sky-600">
                            Productos
                        </RouterLink>
                        <RouterLink v-if="isSeller" to="/mis-productos"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition"
                            active-class="text-sky-600">
                            Mis Productos
                        </RouterLink>
                        <RouterLink v-if="isSeller" to="/seller-setup"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition"
                            active-class="text-sky-600">
                            Métodos de envío
                        </RouterLink>
                        <RouterLink to="/chat"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition"
                            active-class="text-sky-600">
                            Soporte
                        </RouterLink>
                        <RouterLink to="/mi-perfil"
                            class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 hover:border-sky-600 transition overflow-hidden bg-gray-100 flex-shrink-0"
                            active-class="border-sky-600">
                            <img v-if="user.avatar_url"
                                :src="user.avatar_url"
                                alt="Avatar"
                                class="w-full h-full object-cover"
                                @error="user.avatar_url = null" />
                            <svg v-else fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6 text-gray-500">
                                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4s-4 1.79-4 4 1.79 4 4 4z" />
                                <path d="M12 14c-4.41 0-8 1.79-8 4v2h16v-2c0-2.21-3.59-4-8-4z" />
                            </svg>
                        </RouterLink>
                    </template>
                </div>
            </div>

            <div :class="{'hidden': !mobileMenuOpen}" class="w-full md:hidden">
                <ul class="font-medium flex flex-col p-4 mt-4 border border-gray-200 rounded-lg bg-white space-y-2">
                    <li>
                        <RouterLink to="/" @click="mobileMenuOpen = false"
                            class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                            active-class="text-sky-600 bg-sky-50">
                            Inicio
                        </RouterLink>
                    </li>
                    <li>
                        <RouterLink to="/productos" @click="mobileMenuOpen = false"
                            class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                            active-class="text-sky-600 bg-sky-50">
                            Productos
                        </RouterLink>
                    </li>
                    <li>
                        <RouterLink to="/carrito" @click="mobileMenuOpen = false"
                            class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                            active-class="text-sky-600 bg-sky-50">
                            Carrito
                        </RouterLink>
                    </li>

                    <template v-if="user.id === null">
                        <li>
                            <RouterLink to="/login" @click="mobileMenuOpen = false"
                                class="block py-2 px-3 text-sky-600 border border-sky-600 font-semibold rounded hover:bg-sky-50 transition text-center">
                                Ingresar
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink to="/register" @click="mobileMenuOpen = false"
                                class="block py-2 px-3 bg-sky-600 text-white font-semibold rounded hover:bg-sky-700 transition text-center">
                                Registrarse
                            </RouterLink>
                        </li>
                    </template>

                    <template v-else>
                        <li>
                            <RouterLink v-if="isSeller" to="/mis-productos" @click="mobileMenuOpen = false"
                                class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                                active-class="text-sky-600 bg-sky-50">
                                Mis Productos
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink to="/chat" @click="mobileMenuOpen = false"
                                class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                                active-class="text-sky-600 bg-sky-50">
                                Soporte
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink to="/mi-perfil" @click="mobileMenuOpen = false"
                                class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                                active-class="text-sky-600 bg-sky-50">
                                Mi Perfil
                            </RouterLink>
                        </li>
                        <li v-if="isSeller">
                            <RouterLink to="/seller-setup" @click="mobileMenuOpen = false"
                                class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 transition"
                                active-class="text-sky-600 bg-sky-50">
                                Métodos de envío
                            </RouterLink>
                        </li>
                        <li>
                            <button @click="() => { handleLogout(); mobileMenuOpen = false }"
                                class="block w-full py-2 px-3 border border-gray-300 rounded text-gray-700 font-semibold hover:bg-gray-100 transition text-center">
                                Cerrar sesión
                            </button>
                        </li>
                    </template>
                </ul>
            </div>
        </div>
    </nav>
</template>
