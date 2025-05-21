<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMenuItem from './AppMenuItem.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const can = (permission) => authStore.hasPermission(permission);

const model = computed(() => [
    {
        label: t('navigation.side_bar.home'),
        items: [
            {
                label: t('navigation.side_bar.dashboard'),
                icon: 'pi pi-fw pi-home',
                to: '/admin/dashboard',
                visible: can('view_dashboard')
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
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
