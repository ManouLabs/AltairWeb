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
        label: t('navigation.side_bar.customers'),
        icon: 'pi pi-fw pi-id-card',
        to: '/admin/customers',
        visible: can('view_customers')
    },
    {
        label: t('navigation.side_bar.accounts'),
        icon: 'pi pi-fw pi-users',
        to: '/admin/accounts',
        visible: authStore.user?.roles?.includes('Super Admin')
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
    },
    {
        label: t('navigation.side_bar.plans'),
        icon: 'pi pi-fw pi-list',
        to: '/admin/plans',
        visible: authStore.user?.roles?.includes('Super Admin')
    }
]);

const productsMenu = computed(() => [
    {
        label: t('navigation.side_bar.categories'),
        icon: 'pi pi-fw pi-th-large',
        to: '/admin/categories',
        visible: can('view_categories')
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
</script>

<template>
    <div>
        <!-- Main Menu section -->
        <p class="menu-section-label">Main Menu</p>
        <ul class="layout-menu">
            <template v-for="(item, i) in mainMenu" :key="'main-' + i">
                <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
            </template>
        </ul>

        <!-- Products section -->
        <p class="menu-section-label">Products</p>
        <ul class="layout-menu">
            <template v-for="(item, i) in productsMenu" :key="'products-' + i">
                <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
            </template>
        </ul>

        <!-- Settings section -->
        <p class="menu-section-label">Settings</p>
        <ul class="layout-menu">
            <template v-for="(item, i) in settingsMenu" :key="'settings-' + i">
                <app-menu-item v-if="item.visible !== false" :item="item" :index="i" :root="false"></app-menu-item>
            </template>
        </ul>
    </div>
</template>
