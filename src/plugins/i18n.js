// src/plugins/i18n.js
import messages from '@intlify/unplugin-vue-i18n/messages';
import { createI18n } from 'vue-i18n';

const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'fr';

const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE || 'fr',
    globalInjection: true,
    messages,
    missingWarn: false,
    fallbackWarn: false
});

export default i18n;
