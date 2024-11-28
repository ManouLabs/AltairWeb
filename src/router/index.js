import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { createRouter, createWebHistory } from 'vue-router';

const adminRoutes = [
    { path: 'dashboard', name: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
    { path: 'users', name: 'users', component: () => import('@/views/admin/Users.vue') },
    { path: 'roles', name: 'roles', component: () => import('@/views/admin/roles/Roles.vue') }
];

const routes = [
    {
        path: '/admin',
        component: () => import('@/layout/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: adminRoutes
    },
    { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
    { path: '/pages/notfound', name: 'notfound', component: () => import('@/views/pages/NotFound.vue') },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/pages/auth/Login.vue'),
        meta: { requiresGuest: true }
    },
    { path: '/auth/access', name: 'accessDenied', component: () => import('@/views/pages/auth/Access.vue') },
    { path: '/auth/error', name: 'error', component: () => import('@/views/pages/auth/Error.vue') }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const handleRouteGuard = async (to, next, authStore) => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next({ name: 'login' });
    }

    if (to.meta.requiresGuest && authStore.isAuthenticated) {
        return next({ name: 'dashboard' });
    }

    next();
};

router.beforeEach(async (to, from, next) => {
    const loading = useLoading();
    const authStore = useAuthStore();

    loading.startPageLoading();

    try {
        if (to.meta.requiresAuth) {
            if (!authStore.isAuthenticated || !authStore.user) {
                await authStore.fetchUser();
            }
        }

        await handleRouteGuard(to, next, authStore);
    } catch (error) {
        next({ name: 'error' });
    } finally {
        loading.stopPageLoading();
    }
});

export default router;
