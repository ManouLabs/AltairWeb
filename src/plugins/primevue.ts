// src/plugins/primevue.ts
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

export function setupPrimeVue(app: App): void {
    app.use(PrimeVue, {
        ripple: true,
        locale: getPrimeVueLocale(i18n.global.locale.value),
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.app-dark'
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
