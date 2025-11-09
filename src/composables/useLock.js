// src/composables/useLock.js
import { ref } from 'vue';

export function useLock(defaultFields = [], recordsRef = null) {
    const lockedRow = ref([]);

    const frozenColumns = ref(
        defaultFields.reduce((acc, field) => {
            acc[field] = false;
            return acc;
        }, {})
    );

    const toggleLock = (data, frozen, index) => {
        if (!recordsRef) {
            console.error('recordsRef not provided to useDataTableUI');
            return;
        }

        if (frozen) {
            lockedRow.value = lockedRow.value.filter((c, i) => i !== index);
            recordsRef.value = [...recordsRef.value, data];
        } else {
            recordsRef.value = recordsRef.value.filter((c, i) => i !== index);
            lockedRow.value = [...lockedRow.value, data];
        }
        recordsRef.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
    };

    const clearAllLocks = () => {
        if (!recordsRef) {
            console.error('recordsRef not provided to useDataTableUI');
            return;
        }
        recordsRef.value = [...recordsRef.value, ...lockedRow.value];
        lockedRow.value = [];
        recordsRef.value.sort((val1, val2) => (val1.id < val2.id ? -1 : 1));
    };

    const isRowLocked = (id) => {
        return lockedRow.value.some((row) => row.id === id);
    };

    const toggleColumnFrozen = (column) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: !frozenColumns.value[column]
        };
    };

    const freezeColumn = (column) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: true
        };
    };

    const unfreezeColumn = (column) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: false
        };
    };

    const unfreezeAllColumns = () => {
        Object.keys(frozenColumns.value).forEach((column) => {
            frozenColumns.value[column] = false;
        });
    };

    const isColumnFrozen = (column) => {
        return !!frozenColumns.value[column];
    };

    const getFrozenColumns = () => {
        return Object.keys(frozenColumns.value).filter((column) => frozenColumns.value[column]);
    };

    const addColumn = (column, frozen = false) => {
        frozenColumns.value = {
            ...frozenColumns.value,
            [column]: frozen
        };
    };

    const removeColumn = (column) => {
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
