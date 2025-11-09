// src/composables/useDynamicColumns.js
import { useColumnStore } from '@/stores/useColumnStore';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export function useDynamicColumns(pageId, defaultFields, translationPrefix) {
    const { t } = useI18n();
    const columnStore = useColumnStore();

    const savedFields = ref(columnStore.getColumns(pageId) || defaultFields);

    if (!columnStore.getColumns(pageId)) {
        columnStore.setColumns(pageId, defaultFields);
    }

    const selectedColumns = computed(() =>
        savedFields.value.map((field) => ({
            field,
            header: t(`${translationPrefix}.${field}`)
        }))
    );

    const columnChanged = (newColumns) => {
        savedFields.value = newColumns.map((col) => col.field);
        columnStore.setColumns(pageId, savedFields.value);
    };

    return {
        selectedColumns,
        columnChanged,
        savedFields
    };
}
