// src/composables/useDynamicColumns.ts
import { useColumnStore } from '@/stores/useColumnStore';
import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Column {
    field: string;
    header: string;
}

export function useDynamicColumns(
    pageId: string,
    defaultFields: string[],
    translationPrefix: string
): {
    selectedColumns: ComputedRef<Column[]>;
    columnChanged: (newColumns: Column[]) => void;
    savedFields: Ref<string[]>;
} {
    const { t } = useI18n();
    const columnStore = useColumnStore();

    const columnsFromStore = columnStore.getColumns(pageId);
    const savedFields: Ref<string[]> = ref(columnsFromStore ? columnsFromStore.map((col) => col.field) : defaultFields);

    if (!columnStore.getColumns(pageId)) {
        columnStore.setColumns(
            pageId,
            defaultFields.map((field) => ({
                field,
                header: t(`${translationPrefix}.${field}`)
            }))
        );
    }

    const selectedColumns = computed<Column[]>(() =>
        savedFields.value.map((field) => ({
            field,
            header: t(`${translationPrefix}.${field}`)
        }))
    );

    const columnChanged = (newColumns: Column[]): void => {
        savedFields.value = newColumns.map((col) => col.field);
        columnStore.setColumns(
            pageId,
            savedFields.value.map((field) => ({
                field,
                header: t(`${translationPrefix}.${field}`)
            }))
        );
    };

    return {
        selectedColumns,
        columnChanged,
        savedFields
    };
}
