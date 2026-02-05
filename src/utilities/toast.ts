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
    SEARCH: 'search'
} as const;

type ActionType = (typeof ACTIONS)[keyof typeof ACTIONS];

interface ShowToastReturn {
    showToast: (severity: ToastSeverity, action: ActionType | string, entity: string, group?: string) => void;
}

function useShowToast(): ShowToastReturn {
    const toast = useToast();
    const { t } = useI18n();

    function showToast(severity: ToastSeverity, action: ActionType | string, entity: string, group?: string): void {
        try {
            toast.add({
                severity,
                summary: t(`common.toasts.${action}.summary`, { entity: t(`entity.${entity}`) }),
                detail: t(`common.toasts.${action}.detail`, { entity: t(`entity.${entity}`) }),
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
