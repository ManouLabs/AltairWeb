import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const i18n = createI18n({
    locale: 'fr',
    fallbackLocale: 'fr',
    messages: {
        en: {
            login: {
                welcome: 'Welcome to Altair!',
                sign_in_message: 'Sign in to continue',
                email: 'Email',
                password: 'Password',
                remember_me: 'Remember me',
                forgot_password: 'Forgot password?',
                sign_in: 'Sign in'
            }
        },
        fr: {
            login: {
                welcome: 'Bienvenue a Altair!',
                sign_in_message: 'Connectez-vous pour continuer',
                email: 'Email',
                password: 'Mot de passe',
                remember_me: 'Se souvenir de moi',
                forgot_password: 'Mot de passe oublié ?',
                sign_in: 'Connexion'
            }
        }
    }
});

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);
app.use(i18n);
app.use(router);
app.use(PrimeVue, {
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
