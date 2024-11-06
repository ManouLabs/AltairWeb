// stores/useLoadingStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoading = defineStore('loading', () => {
    const isLoading = ref(false);

    function startLoading() {
        isLoading.value = true;
    }

    function stopLoading() {
        isLoading.value = false;
    }

    return {
        isLoading,
        startLoading,
        stopLoading
    };
});
