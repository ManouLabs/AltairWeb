// stores/useThemeStore.js
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { useLoading } from './useLoadingStore';
export const useThemeStore = defineStore('theme', {
    state: () => ({
        isDarkMode: localStorage.getItem('darkMode') === 'true',
        locale: localStorage.getItem('locale') || import.meta.env.VITE_DEFAULT_LOCALE || 'fr' // Set default locale
    }),
    actions: {
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
        },
        setDarkMode(value) {
            this.isDarkMode = value;
        },
        setLocale(value) {
            const loadingStore = useLoading();
            loadingStore.startLoading();
            try {
                this.locale = value;
                i18n.global.locale.value = value;
            } finally {
                loadingStore.stopLoading();
            }
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                key: 'theme',
                storage: localStorage,
                paths: ['isDarkMode', 'locale']
            }
        ]
    }
});
