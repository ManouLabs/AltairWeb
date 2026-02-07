// src/plugins/primevue.ts
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import type { PrimeVueLocaleOptions } from 'primevue/config';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import ToastService from 'primevue/toastservice';
import { watch, type App } from 'vue';
import i18n from './i18n';

import ar from '@/plugins/primevueLocale/ar';
import en from '@/plugins/primevueLocale/en';
import fr from '@/plugins/primevueLocale/fr';

type LocaleKey = 'en' | 'fr' | 'ar';

const rawLocales: Record<LocaleKey, PrimeVueLocaleOptions> = { en, fr, ar };

export function getPrimeVueLocale(locale: string): PrimeVueLocaleOptions {
    return rawLocales[locale as LocaleKey] || rawLocales.en;
}

// Custom Aura preset with violet primary and custom success/danger colors
const CodlyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{violet.50}',
            100: '{violet.100}',
            200: '{violet.200}',
            300: '{violet.300}',
            400: '{violet.400}',
            500: '{violet.500}',
            600: '{violet.600}',
            700: '{violet.700}',
            800: '{violet.800}',
            900: '{violet.900}',
            950: '{violet.950}'
        },
        // Custom teal/emerald green for success states
        colorScheme: {
            light: {
                green: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22'
                },
                red: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                    950: '#450a0a'
                }
            },
            dark: {
                green: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22'
                },
                red: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                    950: '#450a0a'
                }
            }
        }
    }
});

export function setupPrimeVue(app: App): void {
    app.use(PrimeVue, {
        ripple: true,
        locale: getPrimeVueLocale(i18n.global.locale.value),
        theme: {
            preset: CodlyPreset,
            options: {
                darkModeSelector: '.app-dark',
                cssLayer: false
            }
        }
    });

    app.use(ToastService);
    app.use(ConfirmationService);
    app.use(DialogService);

    watch(
        () => i18n.global.locale.value,
        (newLocale) => {
            app.config.globalProperties.$primevue.config.locale = getPrimeVueLocale(newLocale);
        }
    );
}
