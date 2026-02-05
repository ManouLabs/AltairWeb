// src/plugins/i18n.ts
import messages from '@intlify/unplugin-vue-i18n/messages';
import { createI18n } from 'vue-i18n';

const defaultLocale = (import.meta.env.VITE_DEFAULT_LOCALE as string) || 'fr';

const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: (import.meta.env.VITE_FALLBACK_LOCALE as string) || 'fr',
    globalInjection: true,
    messages,
    missingWarn: false,
    fallbackWarn: false
});

export default i18n;
