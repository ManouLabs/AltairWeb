// src/utilities/toast.js
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';

const TOAST_LIFE = import.meta.env.VITE_TOAST_LIFE || 8000;
const ACTIONS = {
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    UPDATE: 'update',
    STORE: 'store',
    EDIT: 'edit',
    CREATE: 'create',
    SEARCH: 'search'
};

function useShowToast() {
    const toast = useToast();
    const { t } = useI18n();

    function showToast(severity, action, entity, group) {
        try {
            toast.add({
                severity,
                summary: t(`common.toasts.${action}.summary`, { entity: t(`entity.${entity}`) }),
                detail: t(`common.toasts.${action}.detail`, { entity: t(`entity.${entity}`) }),
                life: TOAST_LIFE,
                group: group
            });
        } catch (error) {}
    }

    return { showToast };
}

export { ACTIONS, useShowToast };
