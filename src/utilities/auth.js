// utilities/auth.js
import router from '@/router';

function redirectUser(isAdmin, permissions) {
    let redirectTo = 'accessDenied';

    switch (true) {
        case isAdmin:
            redirectTo = 'dashboard';
            break;

        case permissions.includes('view_dashboard'):
            redirectTo = 'dashboard';
            break;

        case permissions.includes('view_users'):
            redirectTo = 'users';
            break;

        case permissions.includes('view_roles'):
            redirectTo = 'roles';
            break;

        default:
            redirectTo = 'accessDenied';
            break;
    }

    try {
        router.push({ name: redirectTo });
    } catch (error) {
        console.error('Error redirecting:', error);
    }
}

export { redirectUser };
