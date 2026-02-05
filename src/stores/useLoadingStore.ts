// src/stores/useLoadingStore.ts
import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

export const useLoading = defineStore('loading', () => {
    const isPageLoading: Ref<boolean> = ref(false);

    const isDataLoading: Ref<boolean> = ref(false);

    const isFormSending: Ref<boolean> = ref(false);

    const startPageLoading = (): void => {
        isPageLoading.value = true;
    };

    const stopPageLoading = (): void => {
        isPageLoading.value = false;
    };

    const startDataLoading = (): void => {
        isDataLoading.value = true;
    };

    const stopDataLoading = (): void => {
        isDataLoading.value = false;
    };

    const startFormSending = (): void => {
        isFormSending.value = true;
    };

    const stopFormSending = (): void => {
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
