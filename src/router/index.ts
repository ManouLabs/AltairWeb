// src/router/index.ts
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';

interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresSuperAdmin?: boolean;
    requiresPermission?: string;
    activeMenu?: string;
}

const adminRoutes: RouteRecordRaw[] = [
    {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_dashboard' }
    },
    {
        path: 'accounts',
        name: 'accounts',
        component: () => import('@/views/admin/accounts/Accounts.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true }
    },
    {
        path: 'shops',
        name: 'shops',
        component: () => import('@/views/admin/shops/Shops.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_shops' }
    },
    {
        path: 'customers',
        name: 'customers',
        component: () => import('@/views/admin/customers/Customers.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_customers' }
    },
    {
        path: 'shippers',
        name: 'shippers',
        component: () => import('@/views/admin/shippers/Shippers.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_shippers' }
    },
    {
        path: 'shippers/create',
        name: 'shipper-create',
        component: () => import('@/views/admin/shippers/ShipperForm.vue'),
        meta: { requiresAuth: true, requiresPermission: 'create_shippers', activeMenu: '/admin/shippers' }
    },
    {
        path: 'shippers/:id/edit',
        name: 'shipper-edit',
        component: () => import('@/views/admin/shippers/ShipperForm.vue'),
        meta: { requiresAuth: true, requiresPermission: 'update_shippers', activeMenu: '/admin/shippers' }
    },
    {
        path: 'plans',
        name: 'plans',
        component: () => import('@/views/admin/plans/Plans.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true }
    },
    {
        path: 'regions',
        name: 'regions',
        component: () => import('@/views/admin/regions/Regions.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true }
    },
    {
        path: 'cities',
        name: 'cities',
        component: () => import('@/views/admin/cities/Cities.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true }
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
        component: () => import('@/views/admin/myaccount/MyAccount.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: 'categories',
        name: 'categories',
        component: () => import('@/views/admin/categories/Categories.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_categories' }
    }
];

const routes: RouteRecordRaw[] = [
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

const handleRouteGuard = async (to: RouteLocationNormalized, next: NavigationGuardNext, authStore: ReturnType<typeof useAuthStore>): Promise<void> => {
    const meta = to.meta as RouteMeta;

    if (meta.requiresAuth && !authStore.user) {
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

    if (meta.requiresGuest) {
        // If user is logged in, redirect to admin
        if (authStore.isLoggedIn) {
            return next({ path: '/admin' });
        }
    }

    if (meta.requiresSuperAdmin && !authStore.user?.roles?.includes('Super Admin')) {
        return next({ name: 'accessDenied' });
    }

    if (meta.requiresPermission && !authStore.hasPermission(meta.requiresPermission)) {
        return next({ name: 'accessDenied' });
    }

    authStore.resetSessionTimerFromAction();
    next();
};

router.beforeEach(async (to, _from, next) => {
    const loading = useLoading();
    const authStore = useAuthStore();
    authStore.clearErrors();
    loading.startPageLoading();
    try {
        await handleRouteGuard(to, next, authStore);
    } catch (error) {
        loading.stopPageLoading();
        next({ name: 'login' });
    }
});

router.afterEach(() => {
    const loading = useLoading();
    loading.stopPageLoading();
});

export default router;
