// utilities/auth.js
import router from '@/router';
import { useAuthStore } from '@/stores/useAuthStore';

function redirectUser(permissions) {
    const authStore = useAuthStore();

    // If the user can view dashboard, prioritize that
    if (authStore.hasPermission('view_dashboard')) {
        return router.push({ name: 'dashboard' });
    }

    if (authStore.hasPermission('view_users')) {
        return router.push({ name: 'users' });
    }

    if (authStore.hasPermission('view_roles')) {
        return router.push({ name: 'roles' });
    }

    // Default fallback
    try {
        router.push({ name: 'accessDenied' });
    } catch (error) {
        console.error('Error redirecting:', error);
    }
}

export { redirectUser };
