// stores/useLayoutStore.js
import i18n from '@/plugins/i18n';
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';

export const useLayoutStore = defineStore('layout', {
    state: () => ({
        preset: 'Lara',
        primary: 'emerald',
        surface: null,
        isDarkMode: false,
        menuMode: 'static',

        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
        activeMenuItem: null,

        locale: import.meta.env.VITE_DEFAULT_LOCALE || 'fr'
    }),

    actions: {
        applyFromSettings() {
            const settings = useSettingStore().settings;

            this.preset = settings.preset || 'Lara';
            this.primary = settings.primary || 'emerald';
            this.surface = settings.surface || null;
            this.isDarkMode = settings.isDarkMode || false;
            this.menuMode = settings.menuMode || 'static';
            this.staticMenuDesktopInactive = settings.staticMenuDesktopInactive || false;
            this.overlayMenuActive = settings.overlayMenuActive || false;
            this.profileSidebarVisible = settings.profileSidebarVisible || false;
            this.configSidebarVisible = settings.configSidebarVisible || false;
            this.staticMenuMobileActive = settings.staticMenuMobileActive || false;
            this.menuHoverActive = settings.menuHoverActive || false;
            this.activeMenuItem = settings.activeMenuItem || null;
            this.locale = settings.locale || import.meta.env.VITE_DEFAULT_LOCALE || 'fr';

            document.documentElement.classList.toggle('app-dark', this.isDarkMode);
            document.documentElement.dir = this.locale === 'ar' ? 'rtl' : 'ltr';
            i18n.global.locale.value = this.locale;
        },

        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
            document.documentElement.classList.toggle('app-dark', this.isDarkMode);
            useSettingStore().updateSetting('isDarkMode', this.isDarkMode);
        },

        setLocale(value) {
            this.locale = value;
            i18n.global.locale.value = value;
            document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
            useSettingStore().updateSetting('locale', value);
        },

        setActiveMenuItem(item) {
            this.activeMenuItem = item?.value || item;
            useSettingStore().updateSetting('activeMenuItem', this.activeMenuItem);
        },

        setMenuMode(mode) {
            this.menuMode = mode;
            useSettingStore().updateSetting('menuMode', mode);
        },

        onMenuToggle() {
            if (this.menuMode === 'overlay') {
                this.overlayMenuActive = !this.overlayMenuActive;
                useSettingStore().updateSetting('overlayMenuActive', this.overlayMenuActive);
            } else if (window.innerWidth > 991) {
                this.staticMenuDesktopInactive = !this.staticMenuDesktopInactive;
                useSettingStore().updateSetting('staticMenuDesktopInactive', this.staticMenuDesktopInactive);
            } else {
                this.staticMenuMobileActive = !this.staticMenuMobileActive;
                useSettingStore().updateSetting('staticMenuMobileActive', this.staticMenuMobileActive);
            }
        },

        resetMenu() {
            this.overlayMenuActive = false;
            this.staticMenuMobileActive = false;
            this.menuHoverActive = false;
        }
    },

    getters: {
        isSidebarActive: (state) => state.overlayMenuActive || state.staticMenuMobileActive,
        isDarkTheme: (state) => state.isDarkMode,
        getPrimary: (state) => state.primary,
        getSurface: (state) => state.surface
    }
});
