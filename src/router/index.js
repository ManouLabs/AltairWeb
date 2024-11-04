//router/index.js
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { createRouter, createWebHistory } from 'vue-router';

const adminRoutes = [
    { path: 'dashboard', name: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
    { path: 'users', name: 'users', component: () => import('@/views/admin/Users.vue') },
    { path: 'roles', name: 'roles', component: () => import('@/views/admin/Roles.vue') }
];

const routes = [
    {
        path: '/admin',
        component: () => import('@/layout/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: adminRoutes
    },
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/Home.vue')
    },
    {
        path: '/pages/notfound',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/pages/auth/Login.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/auth/access',
        name: 'accessDenied',
        component: () => import('@/views/pages/auth/Access.vue')
    },
    {
        path: '/auth/error',
        name: 'error',
        component: () => import('@/views/pages/auth/Error.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation Guards to handle loading state and auth logic
router.beforeEach((to, from, next) => {
    const { isAuthenticated } = useAuthStore();
    useLoading().startLoading();

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login' });
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

router.afterEach(() => {
    useLoading().stopLoading();
});

export default router;
