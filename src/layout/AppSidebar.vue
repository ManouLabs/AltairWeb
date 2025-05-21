<script setup>
import { useLayoutStore } from '@/stores/useLayoutStore';
import { computed } from 'vue';
import AppMenu from './AppMenu.vue';

const layoutStore = useLayoutStore();

const sidebarPositionClass = computed(() => (layoutStore.locale === 'ar' ? 'right-8' : 'left-8'));
</script>

<template>
    <div class="layout-sidebar" :class="sidebarPositionClass">
        <app-menu></app-menu>
    </div>
</template>
