// src/stores/useSettingStore.js
import apiClient from '@/services/axios';
import { defineStore } from 'pinia';

export const useSettingStore = defineStore('settings', {
    state: () => ({
        settings: {}
    }),

    actions: {
        async fetchSettings() {
            try {
                const response = await apiClient.get('/api/settings');
                this.settings = response.data;
            } catch (error) {}
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
        }
    },

    persist: true
});
