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
                <div class="logo-icon">
                    <i class="pi pi-box"></i>
                </div>
                <span class="logo-text">Codly</span>
            </router-link>
        </div>

        <!-- Search bar -->
        <div class="layout-topbar-search">
            <i class="pi pi-search search-icon"></i>
            <input type="text" placeholder="Search for anything..." />
        </div>

        <!-- Actions -->
        <div class="layout-topbar-actions" :class="directionClass">
            <!-- Locale pill switcher -->
            <div class="locale-switcher">
                <button v-for="locale in supportedLocales" :key="locale" class="locale-btn" :class="{ active: layoutStore.locale === locale }" @click="setLocale(locale)">
                    {{ locale }}
                </button>
            </div>

            <!-- Dark mode toggle -->
            <div class="layout-config-menu">
                <button class="layout-topbar-action" @click="layoutStore.toggleDarkMode">
                    <i :class="['pi', layoutStore.isDarkTheme ? 'pi-moon' : 'pi-sun']"></i>
                </button>
            </div>

            <!-- User menu -->
            <div class="layout-topbar-menu block">
                <div class="layout-topbar-menu-content">
                    <div>
                        <OverlayBadge value="2" severity="danger" size="small">
                            <Button icon="pi pi-bell" variant="text" rounded aria-label="Notification" @click="toggle" />
                        </OverlayBadge>
                        <Popover
                            ref="popNotifications"
                            :showCloseIcon="false"
                            :dismissable="true"
                            :position="'bottom'"
                            :style="{ width: '320px' }"
                            :pt="{
                                content: { style: 'padding:0 !important' }
                            }"
                            @show="getNotifications()"
                        >
                            <div class="notification-popover">
                                <!-- Header -->
                                <div class="notification-header">
                                    <span class="notification-title">Notifications</span>
                                    <button class="mark-read-btn">MARK ALL AS READ</button>
                                </div>

                                <!-- Notification List -->
                                <div v-if="loading.isDataLoading" class="notification-list">
                                    <div v-for="i in 3" :key="i" class="notification-item">
                                        <Skeleton shape="circle" size="2.5rem" />
                                        <div class="notification-content">
                                            <Skeleton width="120px" height="14px" />
                                            <Skeleton width="180px" height="12px" class="mt-1" />
                                            <Skeleton width="60px" height="10px" class="mt-1" />
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="notification-list">
                                    <!-- New Shop Added -->
                                    <div class="notification-item">
                                        <div class="notification-icon notification-icon--purple">
                                            <i class="pi pi-shopping-bag"></i>
                                        </div>
                                        <div class="notification-content">
                                            <div class="notification-item-title">New Shop added</div>
                                            <div class="notification-item-desc">Fashion Hub has joined the platform.</div>
                                            <div class="notification-item-time">2 mins ago</div>
                                        </div>
                                    </div>
                                    <!-- Payment Received -->
                                    <div class="notification-item">
                                        <div class="notification-icon notification-icon--blue">
                                            <i class="pi pi-dollar"></i>
                                        </div>
                                        <div class="notification-content">
                                            <div class="notification-item-title">Payment received</div>
                                            <div class="notification-item-desc">Withdrawal for Nexus Logistics approved.</div>
                                            <div class="notification-item-time">45 mins ago</div>
                                        </div>
                                    </div>
                                    <!-- Low Credits Warning -->
                                    <div class="notification-item">
                                        <div class="notification-icon notification-icon--orange">
                                            <i class="pi pi-exclamation-triangle"></i>
                                        </div>
                                        <div class="notification-content">
                                            <div class="notification-item-title">Low Credits Warning</div>
                                            <div class="notification-item-desc">Swift Freight balance is below threshold.</div>
                                            <div class="notification-item-time">2 hours ago</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div class="notification-footer">
                                    <button class="view-all-btn">View all notifications</button>
                                </div>
                            </div>
                        </Popover>
                    </div>

                    <!-- User info + avatar -->
                    <div class="user-info">
                        <div class="user-details" v-if="user">
                            <p class="user-name">{{ user.name || 'User' }}</p>
                            <p class="user-role">{{ user.roles?.[0] || 'Account' }}</p>
                        </div>
                        <template v-if="user?.profile_image">
                            <OverlayBadge severity="success">
                                <Avatar class="p-overlay-badge cursor-pointer hover:shadow" :image="user.profile_image" @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu" />
                            </OverlayBadge>
                        </template>
                        <template v-else>
                            <Button icon="pi pi-user" @click="toggleMenu" rounded aria-haspopup="true" aria-controls="overlay_menu" />
                        </template>
                    </div>
                    <Menu ref="userMenu" id="overlay_menu" :model="menuItems" :popup="true" />
                </div>
            </div>
        </div>
    </div>
</template>
