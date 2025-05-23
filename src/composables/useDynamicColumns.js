// src/composables/useDynamicColumns.js
import { useColumnStore } from '@/stores/useColumnStore';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export function useDynamicColumns(pageId, defaultFields, translationPrefix) {
    const { t } = useI18n();
    const columnStore = useColumnStore();

    // Load saved fields from column store or use defaults
    const savedFields = ref(columnStore.getColumns(pageId) || defaultFields);

    // Save defaults if not already saved
    if (!columnStore.getColumns(pageId)) {
        columnStore.setColumns(pageId, defaultFields);
    }

    // Computed column definitions
    const selectedColumns = computed(() =>
        savedFields.value.map((field) => ({
            field,
            header: t(`${translationPrefix}.${field}`)
        }))
    );

    // When the user changes visible columns
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
