// src/stores/useColumnStore.js
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';

export const useColumnStore = defineStore('column', {
    state: () => ({}),

    actions: {
        setColumns(pageId, columns) {
            const settingKey = `${pageId}`;
            useSettingStore().updateSetting(settingKey, columns);
        },

        getColumns(pageId) {
            const settingKey = `${pageId}`;
            return useSettingStore().settings[settingKey] || null;
        }
    }
});
