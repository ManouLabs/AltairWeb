// stores/useLoadingStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoading = defineStore('loading', () => {
    const isLoading = ref(false);

    const startLoading = () => {
        isLoading.value = true;
    };

    const stopLoading = () => {
        isLoading.value = false;
    };

    const toggleLoading = () => {
        isLoading.value = !isLoading.value;
    };

    return {
        isLoading,
        startLoading,
        stopLoading,
        toggleLoading
    };
});
