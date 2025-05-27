<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLayoutStore } from '@/stores/useLayoutStore';

import { useShowToast } from '@/utilities/toast';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const showToast = useShowToast();
const { t } = useI18n();

// Locale options & flags
const supportedLocales = ref(import.meta.env.VITE_SUPPORTED_LOCALES ? import.meta.env.VITE_SUPPORTED_LOCALES.split(',') : ['fr', 'en', 'ar']);

const localeFlags = ref(Object.fromEntries(import.meta.env.VITE_LOCALE_FLAGS.split(',').map((item) => item.split(':'))));
const setLocale = (locale) => {
    layoutStore.setLocale(locale);
};

const user = authStore.user;

const logoutUser = async () => {
    try {
        await authStore.logout();
    } catch (error) {
        showToast('error', 'error', 'user', 'tc');
    }
};

const toggleMenu = (event) => {
    userMenu.value.toggle(event);
};

const onLogoClick = () => {
    authStore.redirectUser();
};

const directionClass = computed(() => (layoutStore.locale === 'ar' ? 'mr-auto' : 'ml-auto'));

const flagClass = (locale) => `flag flag-${localeFlags.value[locale]} ${layoutStore.locale === 'ar' ? 'ml-2' : 'mr-2'}`;

const userMenu = ref();

const menuItems = computed(() => [
    {
        label: user.name,
        items: [
            {
                label: t('navigation.top_bar.profile'),
                icon: 'pi pi-user',
                command: () => authStore.myaccount()
            },
            {
                label: t('navigation.top_bar.logout'),
                icon: 'pi pi-power-off',
                command: logoutUser
            }
        ]
    }
]);
</script>

<template>
    <div class="layout-topbar">
        <!-- Logo + toggle -->
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="layoutStore.onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>

            <router-link @click="onLogoClick" to="/" class="layout-topbar-logo">
                <svg viewBox="0 0 54 40" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <!-- Your SVG logo here -->
                </svg>
                <span>ALTAIR</span>
            </router-link>
        </div>

        <!-- Locale + dark mode + user menu -->
        <div class="layout-topbar-actions" :class="directionClass">
            <SelectButton v-model="layoutStore.locale" :options="supportedLocales" :allowEmpty="false" @change="setLocale(layoutStore.locale)">
                <template #option="slotProps">
                    <div class="flex items-center">
                        <img :alt="slotProps.option" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="flagClass(slotProps.option)" style="width: 18px" />
                        <span class="uppercase">{{ slotProps.option }}</span>
                    </div>
                </template>
            </SelectButton>

            <!-- Dark mode toggle -->
            <div class="layout-config-menu">
                <button class="layout-topbar-action" @click="layoutStore.toggleDarkMode">
                    <i :class="['pi', layoutStore.isDarkTheme ? 'pi-moon' : 'pi-sun']"></i>
                </button>
            </div>

            <!-- User menu -->
            <div class="layout-topbar-menu block">
                <div class="layout-topbar-menu-content">
                    <Button icon="pi pi-user" @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu" />
                    <Menu ref="userMenu" id="overlay_menu" :model="menuItems" :popup="true" />
                </div>
            </div>
        </div>
    </div>
</template>
