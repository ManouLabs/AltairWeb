<script setup>
import { useLayoutStore } from '@/stores/useLayoutStore';
import { computed } from 'vue';
import AppMenu from './AppMenu.vue';

const layoutStore = useLayoutStore();

const sidebarPositionClass = computed(() => (layoutStore.locale === 'ar' ? 'right-0' : 'left-0'));
</script>

<template>
    <div class="layout-sidebar" :class="sidebarPositionClass">
        <div class="sidebar-content">
            <app-menu></app-menu>
        </div>
        <div class="sidebar-upgrade">
            <div class="upgrade-card">
                <p class="upgrade-label">PRO PLAN</p>
                <p class="upgrade-text">Upgrade for more limits</p>
                <button class="upgrade-btn">Upgrade Now</button>
            </div>
        </div>
    </div>
</template>
