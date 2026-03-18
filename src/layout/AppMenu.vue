<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMenuItem from './AppMenuItem.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const can = (permission) => authStore.hasPermission(permission);

const mainMenu = computed(() => [
    {
        label: t('navigation.side_bar.dashboard'),
        icon: 'pi pi-fw pi-home',
        to: '/admin/dashboard',
        visible: can('view_dashboard')
    },
    {
        label: t('navigation.side_bar.orders'),
        icon: 'pi pi-fw pi-shopping-bag',
        to: '/admin/orders',
        visible: can('view_orders')
    },
    {
        label: t('navigation.side_bar.exchanges'),
        icon: 'pi pi-fw pi-arrows-h',
        to: '/admin/exchanges',
        visible: can('view_exchanges')
    },
    {
        label: t('navigation.side_bar.customers'),
        icon: 'pi pi-fw pi-id-card',
        to: '/admin/customers',
        visible: can('view_customers')
    },
    {
        label: t('navigation.side_bar.shops'),
        icon: 'pi pi-fw pi-shop',
        to: '/admin/shops',
        visible: can('view_shops')
    },
    {
        label: t('navigation.side_bar.shippers'),
        icon: 'pi pi-fw pi-truck',
        to: '/admin/shippers',
        visible: can('view_shippers')
    }
]);

const saasMenu = computed(() => [
    {
        label: t('navigation.side_bar.accounts'),
        icon: 'pi pi-fw pi-users',
        to: '/admin/accounts',
        visible: authStore.user?.roles?.includes('Super Admin')
    },
    {
        label: t('navigation.side_bar.plans'),
        icon: 'pi pi-fw pi-list',
        to: '/admin/plans',
        visible: authStore.user?.roles?.includes('Super Admin')
    },
    {
        label: t('navigation.side_bar.subscriptions'),
        icon: 'pi pi-fw pi-credit-card',
        to: '/admin/subscriptions',
        visible: authStore.user?.roles?.includes('Super Admin')
    }
]);

const productsMenu = computed(() => [
    {
        label: t('navigation.side_bar.products'),
        icon: 'pi pi-fw pi-box',
        to: '/admin/products',
        visible: can('view_products')
    },
    {
        label: t('navigation.side_bar.categories'),
        icon: 'pi pi-fw pi-th-large',
        to: '/admin/categories',
        visible: can('view_categories')
    },
    {
        label: t('navigation.side_bar.attributes'),
        icon: 'pi pi-fw pi-sliders-h',
        to: '/admin/attributes',
        visible: can('view_attributes')
    },
    {
        label: t('navigation.side_bar.suppliers'),
        icon: 'pi pi-fw pi-building',
        to: '/admin/suppliers',
        visible: can('view_suppliers')
    }
]);

const settingsMenu = computed(() => [
    {
        label: t('navigation.side_bar.regions'),
        icon: 'pi pi-fw pi-map',
        to: '/admin/regions',
        visible: authStore.user?.roles?.includes('Super Admin')
    },
    {
        label: t('navigation.side_bar.cities'),
        icon: 'pi pi-fw pi-building',
        to: '/admin/cities',
        visible: authStore.user?.roles?.includes('Super Admin')
    },
    {
        label: t('navigation.side_bar.user'),
        icon: 'pi pi-fw pi-user',
        visible: can('view_users') || can('view_roles'),
        items: [
            {
                label: t('navigation.side_bar.users'),
                icon: 'pi pi-fw pi-users',
                to: '/admin/users',
                visible: can('view_users')
            },
            {
                label: t('navigation.side_bar.roles'),
                icon: 'pi pi-fw pi-wrench',
                to: '/admin/roles',
                visible: can('view_roles')
            }
        ]
    }
]);

const hasVisibleMainMenu = computed(() => mainMenu.value.some((item) => item.visible !== false));
const hasVisibleProductsMenu = computed(() => productsMenu.value.some((item) => item.visible !== false));
const hasVisibleSettingsMenu = computed(() => settingsMenu.value.some((item) => item.visible !== false));
</script>

<template>
    <div>
        <!-- Main Menu section -->
        <template v-if="hasVisibleMainMenu">
            <p class="menu-section-label">{{ t('navigation.sections.main_menu') }}</p>
            <ul class="layout-menu">
                <template v-for="(item, i) in mainMenu" :key="'main-' + i">
                    <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
                </template>
            </ul>
        </template>

        <!-- Products section -->
        <template v-if="hasVisibleProductsMenu">
            <p class="menu-section-label">{{ t('navigation.sections.products') }}</p>
            <ul class="layout-menu">
                <template v-for="(item, i) in productsMenu" :key="'products-' + i">
                    <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
                </template>
            </ul>
        </template>

        <!-- SaaS section -->
        <template v-if="authStore.user?.roles?.includes('Super Admin')">
            <p class="menu-section-label">{{ t('navigation.sections.billing') }}</p>
            <ul class="layout-menu">
                <template v-for="(item, i) in saasMenu" :key="'saas-' + i">
                    <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
                </template>
            </ul>
        </template>

        <!-- Settings section -->
        <template v-if="hasVisibleSettingsMenu">
            <p class="menu-section-label">{{ t('navigation.sections.settings') }}</p>
            <ul class="layout-menu">
                <template v-for="(item, i) in settingsMenu" :key="'settings-' + i">
                    <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
                </template>
            </ul>
        </template>
    </div>
</template>
