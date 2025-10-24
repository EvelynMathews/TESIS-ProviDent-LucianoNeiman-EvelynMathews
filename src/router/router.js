import { createRouter, createWebHistory } from "vue-router";
import { subscribeToAuthStateChanges } from "../services/auth";
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
];


const router = createRouter({
    history: createWebHistory(),
    routes,
});


let user = {
    id: null,
    email: null,
}
subscribeToAuthStateChanges(newUserState => user = newUserState);


router.beforeEach((to, from) => {
    if (to.meta.requiresAuth && user.id === null) {
        return '/login';
    }
});

export default router;