<script setup>
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useLoading } from '@/stores/useLoadingStore';
import { computed, onMounted, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const loading = useLoading();
const layoutStore = useLayoutStore();

onMounted(() => {
    layoutStore.applyFromSettings();
});

const outsideClickListener = ref(null);
const isSidebarActive = computed(() => layoutStore.isSidebarActive);
watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutStore.menuMode === 'overlay',
        'layout-static': layoutStore.menuMode === 'static',
        'layout-static-inactive': layoutStore.staticMenuDesktopInactive && layoutStore.menuMode === 'static' && layoutStore.locale != 'ar',
        'layout-static-inactive-ar': layoutStore.staticMenuDesktopInactive && layoutStore.menuMode === 'static' && layoutStore.locale == 'ar',
        'layout-overlay-active': layoutStore.overlayMenuActive,
        'layout-mobile-active': layoutStore.staticMenuMobileActive
    };
});

const layoutMainContainer = computed(() => {
    return {
        'layout-main-container': layoutStore.locale !== 'ar' && layoutStore.menuMode === 'static',
        'layout-main-container-ar': layoutStore.locale === 'ar' && layoutStore.menuMode === 'static'
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutStore.resetMenu();
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value); // ✅ fix: reference was wrong
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl?.isSameNode(event.target) || sidebarEl?.contains(event.target) || topbarEl?.isSameNode(event.target) || topbarEl?.contains(event.target));
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
        <DynamicDialog />
        <ConfirmPopup></ConfirmPopup>
        <ProgressBar v-if="loading.isPageLoading" mode="indeterminate" style="height: 4px; z-index: 1000; position: fixed; top: 0; left: 0; width: 100%" />

        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div :class="layoutMainContainer">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>
