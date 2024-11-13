// stores/useColumnStore.js
import { defineStore } from 'pinia';

export const useColumnStore = defineStore('column', {
    state: () => ({}),

    actions: {
        setColumns(pageId, columns) {
            const columnSettings = JSON.parse(localStorage.getItem('columnSettings')) || {};
            columnSettings[pageId] = columns;
            localStorage.setItem('columnSettings', JSON.stringify(columnSettings));
        },

        getColumns(pageId) {
            const columnSettings = JSON.parse(localStorage.getItem('columnSettings')) || {};

            // Return the columns for the specified pageId, or an empty array if none exist
            return columnSettings[pageId] || null;
        }
    },
    persist: {
        key: 'columnSettings',
        storage: localStorage
    }
});
