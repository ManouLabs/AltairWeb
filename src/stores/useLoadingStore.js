// src/stores/useLoadingStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoading = defineStore('loading', () => {
    const isPageLoading = ref(false);

    const isDataLoading = ref(false);

    const isFormSending = ref(false);

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

    const startFormSending = () => {
        isFormSending.value = true;
    };

    const stopFormSending = () => {
        isFormSending.value = false;
    };

    return {
        isPageLoading,
        isDataLoading,
        isFormSending,
        startPageLoading,
        stopPageLoading,
        startDataLoading,
        stopDataLoading,
        startFormSending,
        stopFormSending
    };
});
