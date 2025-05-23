<script setup>
import { useLoading } from '@/stores/useLoadingStore';
import ProgressBar from 'primevue/progressbar';
import Toast from 'primevue/toast';

const loading = useLoading();
</script>
<template>
    <Toast position="center" group="center" />
    <Toast position="top-left" group="tl" />
    <Toast position="top-center" group="tc" />
    <Toast position="top-right" group="tr" />
    <Toast position="bottom-left" group="bl" />
    <Toast position="bottom-center" group="bc" />
    <Toast position="bottom-right" group="br" />

    <ProgressBar v-if="loading.isPageLoading" mode="indeterminate" style="height: 4px" />
    <router-view />
</template>
<style scoped></style>
