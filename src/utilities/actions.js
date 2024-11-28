import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';

const TOAST_LIFE = 8000;
const ACTIONS = {
    DELETE: 'delete',
    UPDATE: 'update',
    STORE: 'store'
};

function findRecordIndex(records, id) {
    return records.value.findIndex((record) => record.id === id);
}

function useShowToast() {
    const toast = useToast();
    const { t } = useI18n();

    function showToast(severity, action, entity) {
        try {
            toast.add({
                severity,
                summary: t(`common.toasts.${action}.summary`, { entity: t(`entity.${entity}`) }),
                detail: t(`common.toasts.${action}.detail`, { entity: t(`entity.${entity}`) }),
                life: TOAST_LIFE,
                group: action === 'new' ? 'br' : 'tc'
            });
        } catch (error) {
            console.error('Error displaying toast:', error);
        }
    }

    return { showToast };
}

export { ACTIONS, findRecordIndex, useShowToast };
