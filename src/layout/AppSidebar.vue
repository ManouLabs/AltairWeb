<script setup>
import AppMenu from './AppMenu.vue';
import { useLayoutStore } from '@/stores/useLayoutStore';

const layoutStore = useLayoutStore();
</script>

<template>
    <div class="layout-sidebar" :class="layoutStore.locale == 'ar' ? 'right-8' : 'left-8'">
        <app-menu></app-menu>
    </div>
</template>

<style lang="scss" scoped></style>
