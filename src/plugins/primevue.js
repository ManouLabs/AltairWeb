// src/plugins/primevue.js
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import ToastService from 'primevue/toastservice';
import { watch } from 'vue';
import i18n from './i18n';

import ar from '@/plugins/primevueLocale/ar.js';
import en from '@/plugins/primevueLocale/en.js';
import fr from '@/plugins/primevueLocale/fr.js';

const rawLocales = { en, fr, ar };

export function getPrimeVueLocale(locale) {
    return rawLocales[locale] || rawLocales.en;
}

export function setupPrimeVue(app) {
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
