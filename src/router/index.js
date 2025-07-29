// src/router/index.js
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { createRouter, createWebHistory } from 'vue-router';

const adminRoutes = [
    {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_dashboard' }
    },
    {
        path: 'users',
        name: 'users',
        component: () => import('@/views/admin/users/Users.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_users' }
    },
    {
        path: 'roles',
        name: 'roles',
        component: () => import('@/views/admin/roles/Roles.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_roles' }
    },
    {
        path: 'myaccount',
        name: 'myaccount',
        component: () => import('@/views/admin/account/MyAccount.vue'),
        meta: { requiresAuth: true }
    }
];

const routes = [
    {
        path: '/admin',
        component: () => import('@/layout/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: adminRoutes
    },
    { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/pages/auth/Login.vue'),
        meta: { requiresGuest: true }
    },
    { path: '/auth/access', name: 'accessDenied', component: () => import('@/views/pages/auth/Access.vue') },
    { path: '/auth/error', name: 'error', component: () => import('@/views/pages/auth/Error.vue') },
    {
        path: '/:pathMatch(.*)*',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const handleRouteGuard = async (to, next, authStore) => {
    if (to.meta.requiresAuth && !authStore.user) {
        try {
            await authStore.fetchUser();
        } catch (e) {
            // Ignore fetch errors
        }
        if (authStore.user) {
            return next();
        } else {
            console.warn('User not authenticated, redirecting to login');
            return next({ name: 'login', query: { redirect: to.fullPath } });
        }
    }

    if (to.meta.requiresGuest) {
        if (authStore.user) {
            try {
                await authStore.fetchUser();
            } catch (e) {}
            if (authStore.user) {
                return next({ name: 'dashboard' });
            }
        }
    }

    if (to.meta.requiresPermission && !authStore.hasPermission(to.meta.requiresPermission)) {
        return next({ name: 'accessDenied' });
    }

    authStore.resetSessionTimerFromAction();
    next();
};

router.beforeEach(async (to, from, next) => {
    const loading = useLoading();
    const authStore = useAuthStore();
    authStore.clearErrors();
    loading.startPageLoading();

    try {
        await handleRouteGuard(to, next, authStore);
    } catch (error) {
        next({ name: 'login' });
    } finally {
        loading.stopPageLoading();
    }
});

export default router;
