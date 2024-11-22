<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMenuItem from './AppMenuItem.vue';

// Access the `t` function for translations in JavaScript logic
const { t } = useI18n();

const model = computed(() => [
    {
        label: t('navigation.side_bar.home'),
        items: [
            { label: t('navigation.side_bar.dashboard'), icon: 'pi pi-fw pi-home', to: '/admin/dashboard' },
            {
                label: t('navigation.side_bar.user'),
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: t('navigation.side_bar.users'),
                        icon: 'pi pi-fw pi-users',
                        to: '/admin/users'
                    },
                    {
                        label: t('navigation.side_bar.roles'),
                        icon: 'pi pi-fw pi-wrench',
                        to: '/admin/roles'
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
