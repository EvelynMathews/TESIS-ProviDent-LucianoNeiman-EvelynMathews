/**
 * Configuración centralizada de las rutas de la aplicación Vue Router.
 * Propósito: Definir la navegación de la aplicación, mapeando URLs a componentes
 * de vista (páginas) y aplicando lógica de protección de rutas (middleware).
 * Funcionamiento: Define un array `routes` con las rutas públicas y privadas.
 * El hook `router.beforeEach` intercepta la navegación para verificar si la
 * ruta requiere autenticación (`to.meta.requiresAuth`). Si es necesario y el usuario
 * no está logueado, lo redirige a `/login`. Las rutas de `/admin` utilizan
 * el middleware `requireAdmin` para la protección basada en roles.
 */

import { createRouter, createWebHistory } from "vue-router";
import { subscribeToAuthStateChanges } from "../services/auth";
import { supabase } from "../services/supabase";
import { requireAdmin } from "../middleware/admin";
import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import GlobalChat from "../pages/GlobalChat.vue";
import MyProfile from "../pages/MyProfile.vue";
import MyProfileEdit from "../pages/MyProfileEdit.vue";
import UserProfile from "../pages/UserProfile.vue";
import Products from "../pages/Products.vue";
import ProductDetail from "../pages/ProductDetail.vue";
import ProductEdit from "../pages/ProductEdit.vue";
import ServiceDetail from "../pages/ServiceDetail.vue";
import NewsDetail from "../pages/NewsDetail.vue";
import Cart from "../pages/Cart.vue";
import Publish from "../pages/Publish.vue";
import MyProducts from "../pages/MyProducts.vue";
import SellerSetup from "../pages/SellerSetup.vue";
import ShippingMethodEdit from "../pages/ShippingMethodEdit.vue";
import AuthCallback from "../pages/AuthCallback.vue";
import AdminLogin from "../pages/admin/Login.vue";
import AdminDashboard from "../pages/admin/Dashboard.vue";
import AdminProducts from "../pages/admin/Products.vue";
import AdminProfile from "../pages/admin/Profile.vue";

const routes = [
    { path: '/',                        name: 'Home',                       component: Home },
    { path: '/login',                   name: 'Login',                      component: Login, },
    { path: '/register',                name: 'Register',                   component: Register, },
    { path: '/auth/callback',           name: 'AuthCallback',               component: AuthCallback, },
    { path: '/mi-perfil',               name: 'MyProfile',                  component: MyProfile,             meta: { requiresAuth: true, }, },
    { path: '/mi-perfil/editar',        name: 'MyProfileEdit',              component: MyProfileEdit,         meta: { requiresAuth: true, }, },
    { path: '/usuario/:id',             name: 'UserProfile',                component: UserProfile,           meta: { requiresAuth: true, }, },
    { path: '/chat',                    name: 'GlobalChat',                 component: GlobalChat,            meta: { requiresAuth: true, }, },
    { path: '/productos',               name: 'Products',                   component: Products, },
    { path: '/productos/:id',           name: 'ProductDetail',              component: ProductDetail, },
    { path: '/productos/:id/editar',    name: 'ProductEdit',                component: ProductEdit,           meta: { requiresAuth: true, }, },
    { path: '/servicios/:id',           name: 'ServiceDetail',              component: ServiceDetail, },
    { path: '/noticias/:slug',          name: 'NewsDetail',                 component: NewsDetail, },
    { path: '/carrito',                 name: 'Cart',                       component: Cart,                  meta: { requiresAuth: true, }, },
    { path: '/publicar',                name: 'Publish',                    component: Publish,               meta: { requiresAuth: true, }, },
    { path: '/mis-productos',           name: 'MyProducts',                 component: MyProducts,            meta: { requiresAuth: true, }, },
    { path: '/seller-setup',            name: 'SellerSetup',                component: SellerSetup,           meta: { requiresAuth: true, }, },
    { path: '/metodos-envio/:id',       name: 'ShippingMethodEdit',         component: ShippingMethodEdit,    meta: { requiresAuth: true, }, },
    { path: '/admin/login',             name: 'AdminLogin',                 component: AdminLogin, },
    { path: '/admin/dashboard',         name: 'AdminDashboard',             component: AdminDashboard,        beforeEnter: requireAdmin, },
    { path: '/admin/products',          name: 'AdminProducts',              component: AdminProducts,         beforeEnter: requireAdmin, },
    { path: '/admin/profile',           name: 'AdminProfile',               component: AdminProfile,          beforeEnter: requireAdmin, },
];


const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from) => {
    if (to.meta.requiresAuth) {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) {
            return '/login';
        }
    }
});

export default router;
