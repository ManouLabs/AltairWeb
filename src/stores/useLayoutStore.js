import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { useLoading } from './useLoadingStore';

export const useLayoutStore = defineStore('layout', {
    state: () => {
        const storage = JSON.parse(localStorage.getItem('layout')) || {};
        const isDarkMode = storage?.isDarkMode ?? false;
        // Apply the dark mode class during state initialization
        document.documentElement.classList.toggle('app-dark', isDarkMode);
        document.documentElement.dir = storage.locale === 'ar' ? 'rtl' : 'ltr';
        return {
            preset: storage?.preset || 'Lara',
            primary: storage?.primary || 'emerald',
            surface: storage?.surface || null,
            isDarkMode: isDarkMode,
            menuMode: storage?.menuMode || 'static',

            staticMenuDesktopInactive: storage?.staticMenuDesktopInactive === 'true' || false,
            overlayMenuActive: storage?.overlayMenuActive === 'true' || false,
            profileSidebarVisible: storage?.profileSidebarVisible === 'true' || false,
            configSidebarVisible: storage?.configSidebarVisible === 'true' || false,
            staticMenuMobileActive: storage?.staticMenuMobileActive === 'true' || false,
            menuHoverActive: storage?.menuHoverActive === 'true' || false,
            activeMenuItem: storage?.activeMenuItem || null,

            locale: storage?.locale || import.meta.env.VITE_DEFAULT_LOCALE || 'fr' // Default locale
        };
    },

    actions: {
        // Layout Actions
        setPrimary(value) {
            this.primary = value;
        },
        setSurface(value) {
            this.surface = value;
        },
        setPreset(value) {
            this.preset = value;
        },
        setActiveMenuItem(item) {
            this.activeMenuItem = item.value || item;
        },
        setMenuMode(mode) {
            this.menuMode = mode;
        },
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
            document.documentElement.classList.toggle('app-dark', this.isDarkMode);
        },
        onMenuToggle() {
            if (this.menuMode === 'overlay') {
                this.overlayMenuActive = !this.overlayMenuActive;
            }

            if (window.innerWidth > 991) {
                this.staticMenuDesktopInactive = !this.staticMenuDesktopInactive;
            } else {
                this.staticMenuMobileActive = !this.staticMenuMobileActive;
            }
        },
        resetMenu() {
            this.overlayMenuActive = false;
            this.staticMenuMobileActive = false;
            this.menuHoverActive = false;
        },

        // Theme and Localization Actions
        setLocale(value) {
            const loadingStore = useLoading();
            loadingStore.startLoading();
            try {
                this.locale = value;
                i18n.global.locale.value = value;
                document.documentElement.dir = this.locale === 'ar' ? 'rtl' : 'ltr';
            } finally {
                loadingStore.stopLoading();
            }
        }
    },

    getters: {
        isSidebarActive(state) {
            return state.overlayMenuActive || state.staticMenuMobileActive;
        },
        isDarkTheme(state) {
            return state.isDarkMode;
        },
        getPrimary(state) {
            return state.primary;
        },
        getSurface(state) {
            return state.surface;
        }
    },

    persist: {
        key: 'layout',
        storage: localStorage
    }
});
