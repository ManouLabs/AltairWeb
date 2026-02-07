// src/stores/useLayoutStore.ts
import i18n from '@/plugins/i18n';
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';

type ThemeMode = 'light' | 'dark' | 'system';
type MenuMode = 'static' | 'overlay' | 'slim' | 'slim-plus' | 'reveal' | 'drawer' | 'horizontal';
type Locale = 'fr' | 'en' | 'ar';

interface LayoutState {
    preset: string;
    primary: string;
    surface: string | null;
    theme: ThemeMode;
    menuMode: MenuMode;
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    profileSidebarVisible: boolean;
    configSidebarVisible: boolean;
    staticMenuMobileActive: boolean;
    menuHoverActive: boolean;
    activeMenuItem: string | null;
    locale: Locale;
}

interface MenuItem {
    value?: string;
}

export const useLayoutStore = defineStore('layout', {
    state: (): LayoutState => ({
        preset: 'Aura',
        primary: 'violet',
        surface: null,
        theme: 'light',
        menuMode: 'static',
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
        activeMenuItem: null,
        locale: (import.meta.env.VITE_DEFAULT_LOCALE as Locale) || 'fr'
    }),

    actions: {
        applyFromSettings(): void {
            const settingsStore = useSettingStore();
            const settings = settingsStore.settings;

            // Ensure settings exist (important for first login)
            if (!settings || Object.keys(settings).length === 0) {
                settingsStore.initializeDefaults();
            }

            this.preset = (settings.preset as string) || 'Lara';
            this.primary = (settings.primary as string) || 'emerald';
            this.surface = (settings.surface as string) || null;
            this.theme = (settings.theme as ThemeMode) || 'light';
            this.menuMode = (settings.menuMode as MenuMode) || 'static';
            this.staticMenuDesktopInactive = (settings.staticMenuDesktopInactive as boolean) || false;
            this.overlayMenuActive = (settings.overlayMenuActive as boolean) || false;
            this.profileSidebarVisible = (settings.profileSidebarVisible as boolean) || false;
            this.configSidebarVisible = (settings.configSidebarVisible as boolean) || false;
            this.staticMenuMobileActive = (settings.staticMenuMobileActive as boolean) || false;
            this.menuHoverActive = (settings.menuHoverActive as boolean) || false;
            this.activeMenuItem = (settings.activeMenuItem as string) || null;
            this.locale = (settings.locale as Locale) || (import.meta.env.VITE_DEFAULT_LOCALE as Locale) || 'fr';
            if (this.theme === 'system') {
                const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('app-dark', isSystemDark);
            } else {
                document.documentElement.classList.toggle('app-dark', this.theme === 'dark');
            }
            document.documentElement.dir = this.locale === 'ar' ? 'rtl' : 'ltr';
            i18n.global.locale.value = this.locale;
        },

        toggleDarkMode(): void {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.classList.toggle('app-dark', this.theme === 'dark');
            useSettingStore().updateSetting('theme', this.theme);
        },

        setTheme(value: ThemeMode): void {
            this.theme = value;
            if (value === 'system') {
                const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('app-dark', isSystemDark);
            } else {
                document.documentElement.classList.toggle('app-dark', value === 'dark');
            }
            useSettingStore().updateSetting('theme', value);
        },

        setLocale(value: Locale): void {
            this.locale = value;
            i18n.global.locale.value = value;
            document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
            useSettingStore().updateSetting('locale', value);
        },

        setActiveMenuItem(item: MenuItem | string | null): void {
            this.activeMenuItem = (item as MenuItem)?.value || (item as string);
            useSettingStore().updateSetting('activeMenuItem', this.activeMenuItem);
        },

        setMenuMode(mode: MenuMode): void {
            this.menuMode = mode;
            useSettingStore().updateSetting('menuMode', mode);
        },

        onMenuToggle(): void {
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

        resetMenu(): void {
            this.overlayMenuActive = false;
            this.staticMenuMobileActive = false;
            this.menuHoverActive = false;
        },

        setPrimary(value: string): void {
            this.primary = value;
            useSettingStore().updateSetting('primary', value);
        },

        setSurface(value: string): void {
            this.surface = value;
            useSettingStore().updateSetting('surface', value);
        },

        setPreset(value: string): void {
            this.preset = value;
            useSettingStore().updateSetting('preset', value);
        }
    },

    getters: {
        isSidebarActive: (state): boolean => state.overlayMenuActive || state.staticMenuMobileActive,
        isDarkTheme: (state): boolean => {
            if (state.theme === 'dark') return true;
            if (state.theme === 'light') return false;
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        },
        getPrimary: (state): string => state.primary,
        getSurface: (state): string | null => state.surface
    }
});
