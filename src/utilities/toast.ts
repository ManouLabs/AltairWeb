// src/utilities/toast.ts
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

const TOAST_LIFE = parseInt(import.meta.env.VITE_TOAST_LIFE as string) || 8000;

const ACTIONS = {
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    UPDATE: 'update',
    STORE: 'store',
    EDIT: 'edit',
    CREATE: 'create',
    SEARCH: 'search',
    FETCH: 'fetch'
} as const;

type ActionType = (typeof ACTIONS)[keyof typeof ACTIONS];

interface ShowToastReturn {
    showToast: (severity: ToastSeverity, action: ActionType | string, entity: string, group?: string, errorResponse?: any) => void;
}

function useShowToast(): ShowToastReturn {
    const toast = useToast();
    const { t } = useI18n();

    function extractErrorMessage(errorResponse: any): string | null {
        if (!errorResponse) return null;

        const data = errorResponse?.response?.data;
        if (!data) return null;

        // Single message: { message: "Something went wrong" }
        if (data.message && typeof data.message === 'string') {
            return data.message;
        }

        // Validation errors: { errors: { field: ["Error 1", "Error 2"] } }
        if (data.errors && typeof data.errors === 'object') {
            const firstField = Object.values(data.errors)[0];
            if (Array.isArray(firstField) && firstField.length > 0) {
                return firstField[0] as string;
            }
            if (typeof firstField === 'string') {
                return firstField;
            }
        }

        return null;
    }

    function showToast(severity: ToastSeverity, action: ActionType | string, entity: string, group?: string, errorResponse?: any): void {
        try {
            const toastAction = severity === 'error' ? 'error' : action;
            const errorMessage = severity === 'error' ? extractErrorMessage(errorResponse) : null;

            toast.add({
                severity,
                summary: t(`common.toasts.${toastAction}.summary`, { entity: t(`entity.${entity}`) }),
                detail: errorMessage || t(`common.toasts.${toastAction}.detail`, { entity: t(`entity.${entity}`) }),
                life: TOAST_LIFE,
                group: group
            });
        } catch (error) {
            // Silently ignore errors
        }
    }

    return { showToast };
}

export { ACTIONS, useShowToast };
export type { ToastSeverity, ActionType, ShowToastReturn };
