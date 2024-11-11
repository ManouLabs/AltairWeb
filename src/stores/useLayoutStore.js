import i18n from '@/plugins/i18n';
import { defineStore } from 'pinia';
import { useLoading } from './useLoadingStore';

export const useLayoutStore = defineStore('layout', {
    state: () => {
        const storage = JSON.parse(localStorage.getItem('layout')) || {};
        const isDarkMode = storage?.isDarkMode ?? false;

        document.documentElement.classList.toggle('app-dark', isDarkMode);
        document.documentElement.dir = storage.locale === 'ar' ? 'rtl' : 'ltr';

        return {
            preset: storage.preset || 'Lara',
            primary: storage.primary || 'emerald',
            surface: storage.surface || null,
            isDarkMode,
            menuMode: storage.menuMode || 'static',

            staticMenuDesktopInactive: storage.staticMenuDesktopInactive === true,
            overlayMenuActive: storage.overlayMenuActive === true,
            profileSidebarVisible: storage.profileSidebarVisible === true,
            configSidebarVisible: storage.configSidebarVisible === true,
            staticMenuMobileActive: storage.staticMenuMobileActive === true,
            menuHoverActive: storage.menuHoverActive === true,
            activeMenuItem: storage.activeMenuItem || null,

            locale: storage.locale || import.meta.env.VITE_DEFAULT_LOCALE || 'fr' // Default locale
        };
    },

    actions: {
        setPrimary(value) {
            this.primary = value;
        },
        setSurface(value) {
            this.surface = value;
        },
        setPreset(value) {
            this.preset = value;
        },
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
            document.documentElement.classList.toggle('app-dark', this.isDarkMode);
        },
        setActiveMenuItem(item) {
            this.activeMenuItem = item?.value || item;
        },
        setMenuMode(mode) {
            this.menuMode = mode;
        },
        onMenuToggle() {
            if (this.menuMode === 'overlay') {
                this.overlayMenuActive = !this.overlayMenuActive;
            } else if (window.innerWidth > 991) {
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
        async setLocale(value) {
            const loadingStore = useLoading();
            loadingStore.startLoading();
            try {
                this.locale = value;
                i18n.global.locale.value = value;
                document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
            } finally {
                loadingStore.stopLoading();
            }
        }
    },
    getters: {
        isSidebarActive: (state) => state.overlayMenuActive || state.staticMenuMobileActive,
        isDarkTheme: (state) => state.isDarkMode,
        getPrimary: (state) => state.primary,
        getSurface: (state) => state.surface
    },
    persist: {
        key: 'layout',
        storage: localStorage
    }
});
