// src/utilities/auth.ts
import router from '@/router';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RouteLocationRaw } from 'vue-router';

function redirectUser(_permissions: string[]): Promise<void> | void {
    const authStore = useAuthStore();
    const redirectPath = router.currentRoute.value.query.redirect as string | undefined;

    if (redirectPath) {
        return router.push(redirectPath as RouteLocationRaw) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_dashboard')) {
        return router.push({ name: 'dashboard' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_orders')) {
        return router.push({ name: 'orders' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_products')) {
        return router.push({ name: 'products' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_customers')) {
        return router.push({ name: 'customers' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_categories')) {
        return router.push({ name: 'categories' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_suppliers')) {
        return router.push({ name: 'suppliers' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_attributes')) {
        return router.push({ name: 'attributes' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_users')) {
        return router.push({ name: 'users' }) as unknown as Promise<void>;
    }

    if (authStore.hasPermission('view_roles')) {
        return router.push({ name: 'roles' }) as unknown as Promise<void>;
    }

    try {
        router.push({ name: 'accessDenied' });
    } catch (error) {
        // Silently ignore errors
    }
}

export { redirectUser };
