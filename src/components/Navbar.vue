<script>
import { logout, subscribeToAuthStateChanges } from '../services/auth';
import { getCartCount } from '../services/cart';

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
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
        },
    },
    mounted() {
        subscribeToAuthStateChanges(newUserState => this.user = newUserState);
    },
};
</script>

<template>
    <nav class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 py-3">
            <RouterLink to="/" class="flex items-center space-x-3">
                <svg class="w-8 h-8 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span class="text-2xl font-bold text-gray-800 hover:text-sky-600 transition hidden sm:block">
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
                        <RouterLink to="/chat"
                            class="px-4 py-2 text-gray-700 font-medium hover:text-sky-600 transition"
                            active-class="text-sky-600">
                            Soporte
                        </RouterLink>
                        <RouterLink to="/mi-perfil"
                            class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 hover:border-sky-600 transition overflow-hidden"
                            active-class="border-sky-600">
                            <img v-if="user.avatar_url"
                                :src="user.avatar_url"
                                alt="Avatar"
                                class="w-full h-full object-cover" />
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
                        <li>
                            <button @click="handleLogout; mobileMenuOpen = false"
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
