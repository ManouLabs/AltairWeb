//main.js
import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import i18n from '@/plugins/i18n';
import '@/services/EchoService';
import Aura from '@primevue/themes/aura';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);

app.use(i18n);
app.use(router);
app.use(PrimeVue, {
    ripple: true,
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
