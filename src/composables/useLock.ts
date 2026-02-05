// src/composables/useLock.ts
import { ref, type Ref } from 'vue';

interface RowData {
    id: number | string;
    [key: string]: unknown;
}

interface FrozenColumns {
    [key: string]: boolean;
}

export function useLock<T extends RowData>(defaultFields: string[] = [], recordsRef: Ref<T[]> | null = null) {
    const lockedRow: Ref<T[]> = ref([]);

    const frozenColumns: Ref<FrozenColumns> = ref(
        defaultFields.reduce((acc, field) => {
            acc[field] = false;
            return acc;
        }, {} as FrozenColumns)
    );

    const toggleLock = (data: T, frozen: boolean, index: number): void => {
        if (!recordsRef) {
            console.error('recordsRef not provided to useDataTableUI');
            return;
        }

        if (frozen) {
            lockedRow.value = lockedRow.value.filter((_, i) => i !== index);
            recordsRef.value = [...recordsRef.value, data];
        } else {
            recordsRef.value = recordsRef.value.filter((_, i) => i !== index);
            lockedRow.value = [...lockedRow.value, data];
        }
        recordsRef.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
    };

    const clearAllLocks = (): void => {
        if (!recordsRef) {
            console.error('recordsRef not provided to useDataTableUI');
            return;
        }
        recordsRef.value = [...recordsRef.value, ...lockedRow.value];
        lockedRow.value = [];
        recordsRef.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
    };

    const isRowLocked = (id: number | string): boolean => {
        return lockedRow.value.some((row) => row.id === id);
    };

    const toggleColumnFrozen = (column: string): void => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: !frozenColumns.value[column]
        };
    };

    const freezeColumn = (column: string): void => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: true
        };
    };

    const unfreezeColumn = (column: string): void => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: false
        };
    };

    const unfreezeAllColumns = (): void => {
        Object.keys(frozenColumns.value).forEach((column) => {
            frozenColumns.value[column] = false;
        });
    };

    const isColumnFrozen = (column: string): boolean => {
        return !!frozenColumns.value[column];
    };

    const getFrozenColumns = (): string[] => {
        return Object.keys(frozenColumns.value).filter((column) => frozenColumns.value[column]);
    };

    const addColumn = (column: string, frozen: boolean = false): void => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: frozen
        };
    };

    const removeColumn = (column: string): void => {
        const { [column]: _omit, ...rest } = frozenColumns.value;
        frozenColumns.value = rest;
    };

    return {
        lockedRow,
        toggleLock,
        clearAllLocks,
        isRowLocked,
        frozenColumns,
        toggleColumnFrozen,
        freezeColumn,
        unfreezeColumn,
        unfreezeAllColumns,
        isColumnFrozen,
        getFrozenColumns,
        addColumn,
        removeColumn
    };
}
