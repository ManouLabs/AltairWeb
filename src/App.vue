<script setup>
import { useLoading } from '@/stores/useLoadingStore'; // Import the loading store
import ProgressBar from 'primevue/progressbar'; // Import PrimeVue's ProgressBar
import Toast from 'primevue/toast';

// Access the loading store using Pinia
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

    <ProgressBar v-if="loading.isLoading" mode="indeterminate" style="height: 4px" />
    <router-view />
</template>
<style scoped></style>
