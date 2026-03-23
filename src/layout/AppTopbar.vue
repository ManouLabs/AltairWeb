<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useShowToast } from '@/utilities/toast';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const loading = useLoading();
const notificationStore = useNotificationStore();
const showToast = useShowToast();
const { t } = useI18n();
const router = useRouter();

// Locale options & flags
const supportedLocales = ref(import.meta.env.VITE_SUPPORTED_LOCALES ? import.meta.env.VITE_SUPPORTED_LOCALES.split(',') : ['fr', 'en', 'ar']);

const setLocale = (locale) => {
    layoutStore.setLocale(locale);
};

const popNotifications = ref();

const toggle = (event) => {
    popNotifications.value.toggle(event);
};

const onPopoverShow = () => {
    notificationStore.fetchNotifications();
};

const handleMarkAllAsRead = async () => {
    loading.startPageLoading();
    try {
        await notificationStore.markAllAsRead();
    } catch (error) {
        showToast('error', 'error', 'notification', 'tc', error);
    } finally {
        loading.stopPageLoading();
    }
};

const handleMarkAsRead = async (id) => {
    try {
        await notificationStore.markAsRead(id);
    } catch {
        // silent
    }
};

const handleNotificationClick = async (notification) => {
    handleMarkAsRead(notification.id);
    popNotifications.value.hide();
    if (notification.data?.product_id) {
        router.push(`/admin/products/${notification.data.product_id}`);
    }
};

/**
 * Map notification type to icon + color class.
 */
const getNotificationStyle = (data) => {
    const type = data.type;
    switch (type) {
        case 'low_stock':
            return { icon: 'pi pi-exclamation-triangle', colorClass: 'notification-icon--orange' };
        default:
            return { icon: 'pi pi-bell', colorClass: 'notification-icon--blue' };
    }
};

/**
 * Relative time formatting (e.g. "2 mins ago").
 */
const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return t('notifications.time.just_now');
    if (diff < 3600) return t('notifications.time.mins_ago', { n: Math.floor(diff / 60) });
    if (diff < 86400) return t('notifications.time.hours_ago', { n: Math.floor(diff / 3600) });
    return t('notifications.time.days_ago', { n: Math.floor(diff / 86400) });
};

onMounted(() => {
    notificationStore.fetchUnreadCount();
    notificationStore.startListening();
});

onUnmounted(() => {
    notificationStore.stopListening();
});
const user = computed(() => authStore.user);

const logoutUser = async () => {
    try {
        await authStore.logout();
    } catch (error) {
        showToast('error', 'error', 'user', 'tc', error);
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
                        <OverlayBadge v-if="notificationStore.hasUnread" :value="notificationStore.unreadCount" severity="danger" size="small">
                            <Button icon="pi pi-bell" variant="text" rounded aria-label="Notification" @click="toggle" />
                        </OverlayBadge>
                        <Button v-else icon="pi pi-bell" variant="text" rounded aria-label="Notification" @click="toggle" />
                        <Popover
                            ref="popNotifications"
                            :showCloseIcon="false"
                            :dismissable="true"
                            :position="'bottom'"
                            :style="{ width: '360px' }"
                            :pt="{
                                content: { style: 'padding:0 !important' }
                            }"
                            @show="onPopoverShow()"
                        >
                            <div class="notification-popover">
                                <!-- Header -->
                                <div class="notification-header">
                                    <span class="notification-title">{{ t('notifications.title') }}</span>
                                    <button v-if="notificationStore.hasUnread" class="mark-read-btn" :disabled="loading.isFormSending" @click="handleMarkAllAsRead">{{ t('notifications.mark_all_read') }}</button>
                                </div>

                                <!-- Notification List -->
                                <div v-if="notificationStore.loading" class="notification-list">
                                    <div v-for="i in 3" :key="i" class="notification-item">
                                        <Skeleton shape="circle" size="2.5rem" />
                                        <div class="notification-content">
                                            <Skeleton width="120px" height="14px" />
                                            <Skeleton width="180px" height="12px" class="mt-1" />
                                            <Skeleton width="60px" height="10px" class="mt-1" />
                                        </div>
                                    </div>
                                </div>
                                <div v-else-if="notificationStore.notifications.length === 0" class="notification-empty">
                                    <i class="pi pi-inbox" style="font-size: 2rem; color: var(--text-color-secondary); opacity: 0.5"></i>
                                    <span>{{ t('notifications.empty') }}</span>
                                </div>
                                <div v-else class="notification-list">
                                    <div
                                        v-for="notification in notificationStore.notifications"
                                        :key="notification.id"
                                        class="notification-item"
                                        :class="{ 'notification-item--unread': !notification.read_at }"
                                        @click="handleNotificationClick(notification)"
                                    >
                                        <div class="notification-icon" :class="getNotificationStyle(notification.data).colorClass">
                                            <i :class="getNotificationStyle(notification.data).icon"></i>
                                        </div>
                                        <div class="notification-content">
                                            <div class="notification-item-title">{{ notification.data.message }}</div>
                                            <div class="notification-item-time">{{ timeAgo(notification.created_at) }}</div>
                                        </div>
                                        <div v-if="!notification.read_at" class="notification-unread-dot"></div>
                                    </div>
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
                                <Avatar class="p-overlay-badge cursor-pointer hover:shadow" :image="user.profile_image" @click="toggleMenu" aria-haspopup="true" aria-controls="user_menu_popover" />
                            </OverlayBadge>
                        </template>
                        <template v-else>
                            <Button icon="pi pi-user" @click="toggleMenu" rounded aria-haspopup="true" aria-controls="user_menu_popover" />
                        </template>
                    </div>

                    <!-- User Profile Menu Popover -->
                    <Popover
                        ref="userMenu"
                        id="user_menu_popover"
                        :showCloseIcon="false"
                        :dismissable="true"
                        :pt="{
                            content: { style: 'padding: 0 !important' }
                        }"
                    >
                        <div class="profile-menu-popover">
                            <!-- Header -->
                            <div class="profile-menu-header">
                                <span class="profile-menu-label">{{ t('navigation.top_bar.account_info') }}</span>
                            </div>

                            <!-- Menu Items -->
                            <div class="profile-menu-items">
                                <a href="#" class="profile-menu-item" @click="authStore.myaccount()">
                                    <i class="pi pi-user"></i>
                                    <span>{{ t('navigation.top_bar.my_profile') }}</span>
                                </a>
                                <a href="#" class="profile-menu-item">
                                    <i class="pi pi-cog"></i>
                                    <span>{{ t('navigation.top_bar.account_settings') }}</span>
                                </a>
                                <a href="#" class="profile-menu-item">
                                    <i class="pi pi-credit-card"></i>
                                    <span>{{ t('navigation.top_bar.billing') }}</span>
                                </a>
                            </div>

                            <!-- Divider -->
                            <div class="profile-menu-divider"></div>

                            <!-- Logout -->
                            <div class="profile-menu-items">
                                <a href="#" class="profile-menu-item profile-menu-item--danger" @click="logoutUser">
                                    <i class="pi pi-power-off"></i>
                                    <span>{{ t('navigation.top_bar.logout') }}</span>
                                </a>
                            </div>
                        </div>
                    </Popover>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.profile-menu-popover {
    width: 14rem;
    background: var(--surface-card);
    border-radius: 1rem;
    overflow: hidden;
}

.profile-menu-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--surface-border);

    .profile-menu-label {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-color-secondary);
    }
}

.profile-menu-items {
    padding: 0.25rem 0;
}

.profile-menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    text-decoration: none;
    transition: background-color 0.15s ease;

    i {
        font-size: 1rem;
        color: var(--text-color-secondary);
        opacity: 0.7;
    }

    &:hover {
        background-color: var(--surface-hover);
    }

    &--danger {
        color: var(--red-500);

        i {
            color: var(--red-500);
            opacity: 1;
        }

        &:hover {
            background-color: rgba(239, 68, 68, 0.08);
        }
    }
}

.profile-menu-divider {
    height: 1px;
    background: var(--surface-border);
    margin: 0.25rem 0.5rem;
}
</style>
