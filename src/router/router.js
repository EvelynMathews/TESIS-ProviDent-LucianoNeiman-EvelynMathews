import { createRouter, createWebHistory } from "vue-router";
import { subscribeToAuthStateChanges } from "../services/auth";
import { supabase } from "../services/supabase";
import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import GlobalChat from "../pages/GlobalChat.vue";
import MyProfile from "../pages/MyProfile.vue";
import MyProfileEdit from "../pages/MyProfileEdit.vue";
import UserProfile from "../pages/UserProfile.vue";
import Products from "../pages/Products.vue";
import ProductDetail from "../pages/ProductDetail.vue";
import ServiceDetail from "../pages/ServiceDetail.vue";
import Cart from "../pages/Cart.vue";
import Publish from "../pages/Publish.vue";
import MyProducts from "../pages/MyProducts.vue";
import SellerSetup from "../pages/SellerSetup.vue";
import ShippingMethodEdit from "../pages/ShippingMethodEdit.vue";

const routes = [
    { path: '/',                        name: 'Home',                       component: Home },
    { path: '/login',                   name: 'Login',                      component: Login, },
    { path: '/register',                name: 'Register',                   component: Register, },
    { path: '/mi-perfil',               name: 'MyProfile',                  component: MyProfile,             meta: { requiresAuth: true, }, },
    { path: '/mi-perfil/editar',        name: 'MyProfileEdit',              component: MyProfileEdit,         meta: { requiresAuth: true, }, },
    { path: '/usuario/:id',             name: 'UserProfile',                component: UserProfile,           meta: { requiresAuth: true, }, },
    { path: '/chat',                    name: 'GlobalChat',                 component: GlobalChat,            meta: { requiresAuth: true, }, },
    { path: '/productos',               name: 'Products',                   component: Products, },
    { path: '/productos/:id',           name: 'ProductDetail',              component: ProductDetail, },
    { path: '/servicios/:id',           name: 'ServiceDetail',              component: ServiceDetail, },
    { path: '/carrito',                 name: 'Cart',                       component: Cart,                  meta: { requiresAuth: true, }, },
    { path: '/publicar',                name: 'Publish',                    component: Publish,               meta: { requiresAuth: true, }, },
    { path: '/mis-productos',           name: 'MyProducts',                 component: MyProducts,            meta: { requiresAuth: true, }, },
    { path: '/seller-setup',            name: 'SellerSetup',                component: SellerSetup,           meta: { requiresAuth: true, }, },
    { path: '/metodos-envio/:id',       name: 'ShippingMethodEdit',         component: ShippingMethodEdit,    meta: { requiresAuth: true, }, },
];


const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from) => {
    if (to.meta.requiresAuth) {
        const { data } = await supabase.auth.getSession();
        if (!data?.session?.user) {
            return '/login';
        }
    }
});

export default router;
