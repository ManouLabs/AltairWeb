// main.js
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import dayjs from '@/plugins/dayjs';
import i18n from '@/plugins/i18n';
import { setupPrimeVue } from '@/plugins/primevue';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import '@/services/EchoService';

const app = createApp(App);

// 💾 Setup Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// 🌐 Setup i18n (must come before PrimeVue)
app.use(i18n);

// 🎨 Setup PrimeVue
setupPrimeVue(app);

// 🚦 Other plugins
app.use(router);
dayjs.locale(i18n.global.locale.value);

// 🚀 Mount app
app.mount('#app');
