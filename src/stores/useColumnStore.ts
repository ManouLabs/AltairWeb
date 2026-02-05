// src/stores/useColumnStore.ts
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';

interface ColumnConfig {
    field: string;
    header: string;
    [key: string]: unknown;
}

export const useColumnStore = defineStore('column', {
    state: () => ({}),

    actions: {
        setColumns(pageId: string, columns: ColumnConfig[]): void {
            const settingKey = `${pageId}`;
            useSettingStore().updateSetting(settingKey, columns);
        },

        getColumns(pageId: string): ColumnConfig[] | null {
            const settingKey = `${pageId}`;
            return (useSettingStore().settings[settingKey] as ColumnConfig[] | null) || null;
        }
    }
});
