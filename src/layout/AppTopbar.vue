<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useShowToast } from '@/utilities/toast';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const layoutStore = useLayoutStore();
const loading = useLoading();
const authStore = useAuthStore();
const showToast = useShowToast();
const { t } = useI18n();

// Locale options & flags
const supportedLocales = ref(import.meta.env.VITE_SUPPORTED_LOCALES ? import.meta.env.VITE_SUPPORTED_LOCALES.split(',') : ['fr', 'en', 'ar']);

const localeFlags = ref(Object.fromEntries(import.meta.env.VITE_LOCALE_FLAGS.split(',').map((item) => item.split(':'))));
const setLocale = (locale) => {
    layoutStore.setLocale(locale);
};

const notifications = ref([]);
const popNotifications = ref();

const toggle = (event) => {
    popNotifications.value.toggle(event);
};

const getNotifications = () => {
    loading.startDataLoading();
    setTimeout(() => {
        notifications.value = [
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 1, message: 'New message' },
            { id: 2, message: 'Friend request' },
            { id: 3, message: 'Payment received' },
            { id: 4, message: 'Payment received' },
            { id: 5, message: 'Payment received' },
            { id: 6, message: 'Payment received' }
        ];
        loading.stopDataLoading();
    }, 5000); // 5000ms delay for skeleton testing
};
const user = computed(() => authStore.user);

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
                label: t('navigation.top_bar.myaccount'),
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
        <div class="layout-topbar-actions space-x-2" :class="directionClass">
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
                <div class="layout-topbar-menu-content space-x-4">
                    <div>
                        <OverlayBadge value="2" severity="danger" size="small">
                            <Button icon="pi pi-bell" variant="text" rounded aria-label="Notification" @click="toggle" />
                        </OverlayBadge>
                        <Popover
                            ref="popNotifications"
                            :showCloseIcon="true"
                            :dismissable="true"
                            :position="'bottom'"
                            :style="{ width: '350px' }"
                            :pt="{
                                content: { style: 'padding:0 !important' }
                            }"
                            @show="getNotifications()"
                        >
                            <div class="flex flex-col">
                                <!-- Header -->
                                <div class="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                                    <div class="font-semibold text-lg text-surface-900 dark:text-surface-200">{{ t('navigation.top_bar.notifications') }}</div>
                                    <div class="flex items-center gap-2">
                                        <Badge v-if="!loading.isDataLoading" value="8 New" severity="info" />
                                        <Button icon="pi pi-envelope" rounded text aria-label="Mark all as unread" />
                                    </div>
                                </div>
                                <div v-if="loading.isDataLoading">
                                    <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-4 relative group border-b border-surface-200 dark:border-surface-700">
                                        <Skeleton shape="rectangle" size="30px" class="mr-2" />
                                        <div class="flex-1 space-y-1">
                                            <Skeleton width="160px" height="18px" />
                                            <Skeleton width="200px" height="14px" />
                                            <Skeleton width="50px" height="12px" />
                                        </div>
                                    </div>
                                </div>
                                <VirtualScroller v-else :items="notifications" :itemSize="50" :delay="1000" class="border border-surface-200 dark:border-surface-700 rounded" style="height: 400px">
                                    <template v-slot:item="{ notification, options, index }">
                                        <div
                                            class="flex items-center gap-3 px-4 py-2 relative group transition-colors cursor-pointer"
                                            :class="['hover:bg-surface-100 dark:hover:bg-surface-800', !options.last ? 'border-b border-surface dark:border-surface-600' : '']"
                                        >
                                            <Badge severity="danger" class="absolute right-5 top-10" />
                                            <Avatar icon="pi pi-user" class="mr-2" size="small" />
                                            <div class="flex-1 space-y-1">
                                                <div class="font-semibold text-surface-900 dark:text-surface-200 transition-colors">Congratulation Lettie 🎉</div>
                                                <div class="text-md text-surface-500 dark:text-surface-400 transition-colors">Won the monthly best seller gold badge</div>
                                                <div class="text-sm text-surface-400 dark:text-surface-500 transition-colors">1h ago</div>
                                            </div>
                                            <!-- Delete button under dot -->
                                            <div class="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="small" icon="pi pi-times" rounded text aria-label="Delete notification" severity="contrast" />
                                            </div>
                                        </div>
                                    </template>
                                </VirtualScroller>

                                <div class="px-4 py-2 border-t"><Button label="View all notifications" class="w-full" /></div>
                            </div>
                        </Popover>
                    </div>
                    <template v-if="user.profile_image">
                        <OverlayBadge severity="success">
                            <Avatar class="p-overlay-badge cursor-pointer hover:shadow" :image="user.profile_image" @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu" />
                        </OverlayBadge>
                    </template>
                    <template v-else>
                        <Button icon="pi pi-user" @click="toggleMenu" rounded aria-haspopup="true" aria-controls="overlay_menu" />
                    </template>
                    <Menu ref="userMenu" id="overlay_menu" :model="menuItems" :popup="true" />
                </div>
            </div>
        </div>
    </div>
</template>
