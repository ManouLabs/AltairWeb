<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useLoading } from '@/stores/useLoadingStore'; // Import the loading store
import { useThemeStore } from '@/stores/useThemeStore';
import ProgressBar from 'primevue/progressbar'; // Import PrimeVue's ProgressBar
import Toast from 'primevue/toast';
import { computed, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const themeStore = useThemeStore();
// Access the loading store using Pinia
const loading = useLoading();

const { layoutConfig, layoutState, isSidebarActive, resetMenu } = useLayout();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                resetMenu();
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
}
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <Toast position="center" group="center" />
        <Toast position="top-left" group="tl" />
        <Toast position="top-center" group="tc" />
        <Toast position="top-right" group="tr" />
        <Toast position="bottom-left" group="bl" />
        <Toast position="bottom-center" group="bc" />
        <Toast position="bottom-right" group="br" />

        <ProgressBar v-if="loading.isLoading" mode="indeterminate" style="height: 4px; z-index: 1000; position: fixed; top: 0; left: 0; width: 100%" />

        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>
