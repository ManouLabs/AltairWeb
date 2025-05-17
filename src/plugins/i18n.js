// plusgins/i18n.js
import messages from '@intlify/unplugin-vue-i18n/messages';
import { createI18n } from 'vue-i18n';
const storage = JSON.parse(localStorage.getItem('layout'));
const locale = storage?.locale || import.meta.env.VITE_DEFAULT_LOCALE || 'fr';

const i18n = createI18n({
    locale: locale || import.meta.env.VITE_DEFAULT_LOCALE || 'fr',
    fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE || 'fr',
    legacy: false,
    globalInjection: true,
    messages,
    missingWarn: false,
    fallbackWarn: false
});

export default i18n;
