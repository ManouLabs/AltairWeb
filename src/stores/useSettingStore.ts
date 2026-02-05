// src/stores/useSettingStore.ts
import apiClient from '@/services/axios';
import { defineStore } from 'pinia';

type SettingValue = string | number | boolean | null | unknown[] | Record<string, unknown>;

interface Settings {
    theme?: string;
    menuMode?: string;
    locale?: string;
    [key: string]: SettingValue | undefined;
}

interface SettingState {
    settings: Settings;
}

const defaultSettings: Settings = {
    theme: 'light',
    menuMode: 'static',
    locale: (import.meta.env.VITE_DEFAULT_LOCALE as string) || 'fr'
};

export const useSettingStore = defineStore('settings', {
    state: (): SettingState => ({
        settings: {}
    }),

    actions: {
        async fetchSettings(): Promise<void> {
            try {
                const response = await apiClient.get<Settings>('/api/settings');
                const fetchedSettings = response.data || {};

                // If settings are empty or null, use defaults
                if (!fetchedSettings || Object.keys(fetchedSettings).length === 0) {
                    this.settings = { ...defaultSettings };
                } else {
                    // Merge fetched settings with defaults (in case some keys are missing)
                    this.settings = { ...defaultSettings, ...fetchedSettings };
                }
            } catch (error) {
                // On error, use default settings
                this.settings = { ...defaultSettings };
            }
        },

        async saveSettings(): Promise<void> {
            try {
                await apiClient.post('/api/settings', { settings: this.settings });
            } catch (error) {
                // Silently ignore errors
            }
        },

        async updateSetting(key: string, value: SettingValue): Promise<void> {
            this.settings[key] = value;
            try {
                await apiClient.post('/api/settings/update-key', { key, value });
            } catch (error) {
                // Silently ignore errors
            }
        },

        initializeDefaults(): void {
            this.settings = { ...defaultSettings };
        }
    },

    persist: true
});
