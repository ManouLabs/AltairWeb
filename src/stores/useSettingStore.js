// src/stores/useSettingStore.js
import apiClient from '@/services/axios';
import { defineStore } from 'pinia';

const defaultSettings = {
    theme: 'light',
    menuMode: 'static',
    locale: import.meta.env.VITE_DEFAULT_LOCALE || 'fr'
};

export const useSettingStore = defineStore('settings', {
    state: () => ({
        settings: {}
    }),

    actions: {
        async fetchSettings() {
            try {
                const response = await apiClient.get('/api/settings');
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

        async saveSettings() {
            try {
                await apiClient.post('/api/settings', { settings: this.settings });
            } catch (error) {}
        },

        async updateSetting(key, value) {
            this.settings[key] = value;
            try {
                await apiClient.post('/api/settings/update-key', { key, value });
            } catch (error) {}
        },

        initializeDefaults() {
            this.settings = { ...defaultSettings };
        }
    },

    persist: true
});
