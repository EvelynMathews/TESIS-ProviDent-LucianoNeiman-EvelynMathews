/**
 * Configuración centralizada de las rutas de la aplicación Vue Router.
 * Propósito: Definir la navegación de la aplicación, mapeando URLs a componentes
 * de vista (páginas) y aplicando lógica de protección de rutas (middleware).
 * Funcionamiento: Define un array `routes` con las rutas públicas y privadas.
 * El hook `router.beforeEach` intercepta la navegación para verificar si la
 * ruta requiere autenticación (`to.meta.requiresAuth`). Si es necesario y el usuario
 * no está logueado, lo redirige a `/login` recordando a dónde quería ir (`?redirect=`).
 * Las rutas de `/admin` utilizan el middleware `requireAdmin` (tabla `user_roles`).
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
    { path: '/soporte',                 name: 'Support',                    component: () => import('../pages/Support.vue'),            meta: { title: 'Soporte' } },
    { path: '/chat',                    redirect: '/soporte' },
    { path: '/productos',               name: 'Products',                   component: () => import('../pages/Products.vue'),           meta: { title: 'Catálogo' } },
    { path: '/productos/:id',           name: 'ProductDetail',              component: () => import('../pages/ProductDetail.vue'),      meta: { title: 'Detalle del producto' } },
    { path: '/productos/:id/editar',    name: 'ProductEdit',                component: () => import('../pages/ProductEdit.vue'),        meta: { requiresAuth: true, title: 'Editar publicación' } },
    { path: '/servicios',               redirect: { path: '/productos', query: { tipo: 'servicios' } } },
    { path: '/servicios/:id',           redirect: to => `/productos/${to.params.id}` },
    { path: '/noticias/:slug',          name: 'NewsDetail',                 component: () => import('../pages/NewsDetail.vue'),         meta: { title: 'Noticias' } },
    { path: '/carrito',                 name: 'Cart',                       component: () => import('../pages/Cart.vue'),               meta: { title: 'Mi carrito' } },
    { path: '/publicar',                name: 'Publish',                    component: () => import('../pages/Publish.vue'),            meta: { requiresAuth: true, title: 'Publicar' } },
    { path: '/mis-productos',           name: 'MyProducts',                 component: () => import('../pages/MyProducts.vue'),         meta: { requiresAuth: true, title: 'Mis publicaciones' } },
    { path: '/seller-setup',            name: 'SellerSetup',                component: () => import('../pages/SellerSetup.vue'),        meta: { requiresAuth: true, title: 'Configurar ventas' } },
    { path: '/metodos-envio/:id',       name: 'ShippingMethodEdit',         component: () => import('../pages/ShippingMethodEdit.vue'), meta: { requiresAuth: true, title: 'Método de envío' } },
    { path: '/terminos',                name: 'Terms',                      component: () => import('../pages/Terms.vue'),              meta: { title: 'Términos y condiciones' } },
    { path: '/privacidad',              name: 'Privacy',                    component: () => import('../pages/Privacy.vue'),            meta: { title: 'Política de privacidad' } },
    { path: '/admin/login',             name: 'AdminLogin',                 component: () => import('../pages/admin/Login.vue'),        meta: { title: 'Administración' } },
    { path: '/admin',                   redirect: '/admin/dashboard' },
    { path: '/admin/dashboard',         name: 'AdminDashboard',             component: () => import('../pages/admin/Dashboard.vue'),    beforeEnter: requireAdmin, meta: { title: 'Panel de administración' } },
    { path: '/admin/products',          name: 'AdminProducts',              component: () => import('../pages/admin/Products.vue'),     beforeEnter: requireAdmin, meta: { title: 'Productos · Admin' } },
    { path: '/admin/products/:id/edit', name: 'AdminProductEdit',           component: () => import('../pages/admin/ProductEdit.vue'),  beforeEnter: requireAdmin, meta: { title: 'Editar producto · Admin' } },
    { path: '/admin/users',             name: 'AdminUsers',                 component: () => import('../pages/admin/Users.vue'),        beforeEnter: requireAdmin, meta: { title: 'Usuarios · Admin' } },
    { path: '/admin/users/:id/edit',    name: 'AdminUserEdit',              component: () => import('../pages/admin/UserEdit.vue'),     beforeEnter: requireAdmin, meta: { title: 'Editar usuario · Admin' } },
    { path: '/admin/classifieds',       name: 'AdminClassifieds',           component: () => import('../pages/admin/Classifieds.vue'),  beforeEnter: requireAdmin, meta: { title: 'Anuncios de empleo · Admin' } },
    { path: '/admin/classifieds/new',   name: 'AdminClassifiedNew',         component: () => import('../pages/admin/ClassifiedEdit.vue'), beforeEnter: requireAdmin, meta: { title: 'Nuevo anuncio · Admin' } },
    { path: '/admin/classifieds/:id/edit', name: 'AdminClassifiedEdit',     component: () => import('../pages/admin/ClassifiedEdit.vue'), beforeEnter: requireAdmin, meta: { title: 'Editar anuncio · Admin' } },
    { path: '/admin/profile',           name: 'AdminProfile',               component: () => import('../pages/admin/Profile.vue'),      beforeEnter: requireAdmin, meta: { title: 'Perfil · Admin' } },
    { path: '/:pathMatch(.*)*',         name: 'NotFound',                   component: () => import('../pages/NotFound.vue'),           meta: { title: 'Página no encontrada' } },
];


const router = createRouter({
    history: createWebHistory(),
    routes,
    // Al navegar a otra página se arranca desde arriba; "Atrás" recupera la posición previa.
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
        if (savedPosition) return savedPosition
        if (to.path === from.path) return false
        // Moving between two products (e.g. related products) scrolls up smoothly
        if (to.name === from.name) return { top: 0, behavior: 'smooth' }
        return { top: 0 }
    },
});

router.beforeEach(async (to) => {
    if (to.meta.requiresAuth) {
        // Sesión local: rápida y sin pedido de red. Los datos igual están protegidos por RLS en Supabase.
        const { data } = await supabase.auth.getSession();
        if (!data?.session?.user) {
            return { path: '/login', query: { redirect: to.fullPath } };
        }
    }
});

router.afterEach((to) => {
    const title = to.meta?.title;
    document.title = title ? `${title} · ProviDent` : 'ProviDent · Marketplace odontológico';
});

export default router;
