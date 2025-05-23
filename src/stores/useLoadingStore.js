// src/stores/useLoadingStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoading = defineStore('loading', () => {
    const isPageLoading = ref(false);

    const isDataLoading = ref(false);

    const startPageLoading = () => {
        isPageLoading.value = true;
    };

    const stopPageLoading = () => {
        isPageLoading.value = false;
    };

    const startDataLoading = () => {
        isDataLoading.value = true;
    };

    const stopDataLoading = () => {
        isDataLoading.value = false;
    };

    return {
        isPageLoading,
        isDataLoading,
        startPageLoading,
        stopPageLoading,
        startDataLoading,
        stopDataLoading
    };
});
