/**
 * Configuración centralizada de las rutas de la aplicación Vue Router.
 * Propósito: Definir la navegación de la aplicación, mapeando URLs a componentes
 * de vista (páginas) y aplicando lógica de protección de rutas (middleware).
 * Funcionamiento: Define un array `routes` con las rutas públicas y privadas.
 * El hook `router.beforeEach` intercepta la navegación para verificar si la
 * ruta requiere autenticación (`to.meta.requiresAuth`). Si es necesario y el usuario
 * no está logueado, lo redirige a `/login` recordando a dónde quería ir (`?redirect=`).
 * Las rutas de `/admin` utilizan el middleware `requireAdmin` para la protección basada en roles.
 * Las páginas se cargan bajo demanda (lazy loading) para que la primera carga sea más rápida.
 */

import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../services/supabase";
import { requireAdmin } from "../middleware/admin";
import Home from "../pages/Home.vue";

const routes = [
    { path: '/',                        name: 'Home',                       component: Home,                                            meta: { title: 'Marketplace odontológico' } },
    { path: '/login',                   name: 'Login',                      component: () => import('../pages/Login.vue'),              meta: { title: 'Iniciar sesión' } },
    { path: '/register',                name: 'Register',                   component: () => import('../pages/Register.vue'),           meta: { title: 'Crear cuenta' } },
    { path: '/auth/callback',           name: 'AuthCallback',               component: () => import('../pages/AuthCallback.vue'),       meta: { title: 'Confirmando cuenta' } },
    { path: '/mi-perfil',               name: 'MyProfile',                  component: () => import('../pages/MyProfile.vue'),          meta: { requiresAuth: true, title: 'Mi perfil' } },
    { path: '/mi-perfil/editar',        name: 'MyProfileEdit',              component: () => import('../pages/MyProfileEdit.vue'),      meta: { requiresAuth: true, title: 'Editar perfil' } },
    { path: '/usuario/:id',             name: 'UserProfile',                component: () => import('../pages/UserProfile.vue'),        meta: { title: 'Perfil del vendedor' } },
    { path: '/chat',                    name: 'GlobalChat',                 component: () => import('../pages/GlobalChat.vue'),         meta: { requiresAuth: true, title: 'Soporte' } },
    { path: '/productos',               name: 'Products',                   component: () => import('../pages/Products.vue'),           meta: { title: 'Catálogo' } },
    { path: '/productos/:id',           name: 'ProductDetail',              component: () => import('../pages/ProductDetail.vue'),      meta: { title: 'Detalle del producto' } },
    { path: '/productos/:id/editar',    name: 'ProductEdit',                component: () => import('../pages/ProductEdit.vue'),        meta: { requiresAuth: true, title: 'Editar publicación' } },
    { path: '/servicios',               redirect: { path: '/productos', query: { tipo: 'servicios' } } },
    { path: '/servicios/:id',           name: 'ServiceDetail',              component: () => import('../pages/ProductDetail.vue'),      meta: { title: 'Detalle del servicio' } },
    { path: '/noticias/:slug',          name: 'NewsDetail',                 component: () => import('../pages/NewsDetail.vue'),         meta: { title: 'Noticias' } },
    { path: '/carrito',                 name: 'Cart',                       component: () => import('../pages/Cart.vue'),               meta: { requiresAuth: true, title: 'Mi carrito' } },
    { path: '/publicar',                name: 'Publish',                    component: () => import('../pages/Publish.vue'),            meta: { requiresAuth: true, title: 'Publicar' } },
    { path: '/mis-productos',           name: 'MyProducts',                 component: () => import('../pages/MyProducts.vue'),         meta: { requiresAuth: true, title: 'Mis publicaciones' } },
    { path: '/seller-setup',            name: 'SellerSetup',                component: () => import('../pages/SellerSetup.vue'),        meta: { requiresAuth: true, title: 'Configurar ventas' } },
    { path: '/metodos-envio/:id',       name: 'ShippingMethodEdit',         component: () => import('../pages/ShippingMethodEdit.vue'), meta: { requiresAuth: true, title: 'Método de envío' } },
    { path: '/admin/login',             name: 'AdminLogin',                 component: () => import('../pages/admin/Login.vue'),        meta: { title: 'Administración' } },
    { path: '/admin',                   redirect: '/admin/dashboard' },
    { path: '/admin/dashboard',         name: 'AdminDashboard',             component: () => import('../pages/admin/Dashboard.vue'),    beforeEnter: requireAdmin, meta: { title: 'Panel de administración' } },
    { path: '/admin/products',          name: 'AdminProducts',              component: () => import('../pages/admin/Products.vue'),     beforeEnter: requireAdmin, meta: { title: 'Productos · Admin' } },
    { path: '/admin/profile',           name: 'AdminProfile',               component: () => import('../pages/admin/Profile.vue'),      beforeEnter: requireAdmin, meta: { title: 'Perfil · Admin' } },
    { path: '/:pathMatch(.*)*',         name: 'NotFound',                   component: () => import('../pages/NotFound.vue'),           meta: { title: 'Página no encontrada' } },
];


const router = createRouter({
    history: createWebHistory(),
    routes,
    // Al navegar a otra página siempre se arranca desde arriba; "Atrás" recupera la posición previa.
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition
        if (to.hash) return { el: to.hash, top: 80 }
        if (to.path === from.path) return false
        return { top: 0 }
    },
});

router.beforeEach(async (to) => {
    if (to.meta.requiresAuth) {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) {
            return { path: '/login', query: { redirect: to.fullPath } };
        }
    }
});

router.afterEach((to) => {
    const title = to.meta?.title;
    document.title = title ? `${title} · ProviDent` : 'ProviDent · Marketplace odontológico';
});

export default router;
