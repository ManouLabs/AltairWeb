// src/router/index.ts
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';

interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresSuperAdmin?: boolean;
    requiresPermission?: string;
    requiresQuota?: string;
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
        path: 'accounts/create',
        name: 'account-create',
        component: () => import('@/views/admin/accounts/Form.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true, activeMenu: '/admin/accounts' }
    },
    {
        path: 'accounts/:id/edit',
        name: 'account-edit',
        component: () => import('@/views/admin/accounts/Form.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true, activeMenu: '/admin/accounts' }
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
        path: 'customers/:id',
        name: 'customer-show',
        component: () => import('@/views/admin/customers/CustomerShow.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_customers', activeMenu: '/admin/customers' }
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
        component: () => import('@/views/admin/shippers/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'create_shippers', requiresQuota: 'shippers', activeMenu: '/admin/shippers' }
    },
    {
        path: 'shippers/:id/edit',
        name: 'shipper-edit',
        component: () => import('@/views/admin/shippers/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'update_shippers', activeMenu: '/admin/shippers' }
    },
    {
        path: 'plans',
        name: 'plans',
        component: () => import('@/views/admin/plans/Plans.vue'),
        meta: { requiresAuth: true, requiresSuperAdmin: true }
    },
    {
        path: 'subscriptions',
        name: 'subscriptions',
        component: () => import('@/views/admin/subscriptions/Subscriptions.vue'),
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
    },
    {
        path: 'attributes',
        name: 'attributes',
        component: () => import('@/views/admin/attributes/Attributes.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_attributes' }
    },
    {
        path: 'attributes/create',
        name: 'attribute-create',
        component: () => import('@/views/admin/attributes/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'create_attributes', activeMenu: '/admin/attributes' }
    },
    {
        path: 'attributes/:id/edit',
        name: 'attribute-edit',
        component: () => import('@/views/admin/attributes/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'update_attributes', activeMenu: '/admin/attributes' }
    },
    {
        path: 'products',
        name: 'products',
        component: () => import('@/views/admin/products/Products.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_products' }
    },
    {
        path: 'products/create',
        name: 'product-create',
        component: () => import('@/views/admin/products/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'create_products', requiresQuota: 'products', activeMenu: '/admin/products' }
    },
    {
        path: 'products/:id/edit',
        name: 'product-edit',
        component: () => import('@/views/admin/products/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'update_products', activeMenu: '/admin/products' }
    },
    {
        path: 'products/:id',
        name: 'product-show',
        component: () => import('@/views/admin/products/ProductShow.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_products', activeMenu: '/admin/products' }
    },
    {
        path: 'suppliers',
        name: 'suppliers',
        component: () => import('@/views/admin/suppliers/Suppliers.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_suppliers' }
    },
    {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/admin/orders/Orders.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_orders' }
    },
    {
        path: 'orders/create',
        name: 'order-create',
        component: () => import('@/views/admin/orders/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'create_orders', requiresQuota: 'orders', activeMenu: '/admin/orders' }
    },
    {
        path: 'orders/:id/edit',
        name: 'order-edit',
        component: () => import('@/views/admin/orders/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'update_orders', activeMenu: '/admin/orders' }
    },
    {
        path: 'orders/:id',
        name: 'order-show',
        component: () => import('@/views/admin/orders/Form.vue'),
        meta: { requiresAuth: true, requiresPermission: 'view_orders', activeMenu: '/admin/orders' }
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

    // For guest-only routes (login), redirect to admin if already authenticated
    if (meta.requiresGuest) {
        // Check in-memory state first
        if (authStore.user || authStore.isLoggedIn) {
            return next({ path: '/admin' });
        }
        // Also check backend session (e.g. after page refresh, in-memory state is lost)
        try {
            await authStore.fetchUser();
            if (authStore.user) {
                return next({ path: '/admin' });
            }
        } catch (e) {
            // No active session — allow access to login
        }
        return next();
    }

    // For auth-required routes, ensure user is authenticated
    if (meta.requiresAuth && !authStore.user) {
        try {
            await authStore.fetchUser();
        } catch (e) {
            // Ignore fetch errors
        }
        if (!authStore.user) {
            console.warn('User not authenticated, redirecting to login');
            return next({ name: 'login', query: { redirect: to.fullPath } });
        }
    }

    // Permission checks — user is authenticated but may lack the role/permission
    if (meta.requiresSuperAdmin && !authStore.user?.roles?.includes('Super Admin')) {
        return next({ name: 'accessDenied' });
    }

    if (meta.requiresPermission && !authStore.hasPermission(meta.requiresPermission)) {
        return next({ name: 'accessDenied' });
    }

    // Quota checks — user is authenticated and authorized but may have reached their plan limit
    if (meta.requiresQuota) {
        const quotaStore = useQuotaStore();
        if (!quotaStore.loaded) {
            await quotaStore.fetchQuotas();
        }
        if (!quotaStore.canCreate(meta.requiresQuota)) {
            return next({ name: 'accessDenied' });
        }
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
        // If the user is authenticated but something else failed, go to access denied
        if (authStore.user) {
            next({ name: 'accessDenied' });
        } else {
            next({ name: 'login' });
        }
    }
});

router.afterEach(() => {
    // Progress bar is now stopped by each page when data is loaded
});

export default router;
