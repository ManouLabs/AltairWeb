//i18n.js
import { createI18n } from 'vue-i18n';

import messages from '@intlify/unplugin-vue-i18n/messages';
const i18n = createI18n({
    locale: import.meta.env.VITE_DEFAULT_LOCALE || 'fr', // Default locale
    fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE || 'fr', // Fallback locale
    legacy: false, // Composition API mode
    globalInjection: true,
    messages
});

export default i18n;
