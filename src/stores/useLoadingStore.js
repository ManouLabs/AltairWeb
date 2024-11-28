// stores/useLoadingStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoading = defineStore('loading', () => {
    // Loader for general page load or progress bar
    const isPageLoading = ref(false);

    // Loader for data-related loading (e.g., skeleton loader)
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
