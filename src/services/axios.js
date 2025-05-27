// src/services/axios.js
import router from '@/router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useShowToast } from '@/utilities/toast';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
    withXSRFToken: true
});

const startPageLoading = () => useLoading().startPageLoading();
const stopPageLoading = () => useLoading().stopPageLoading();

apiClient.interceptors.request.use(
    async (config) => {
        startPageLoading();
        return config;
    },
    (error) => {
        stopPageLoading();
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        stopPageLoading();
        return response;
    },
    async (error) => {
        stopPageLoading();

        const status = error.status;

        if ([401, 419].includes(status)) {
            const authStore = useAuthStore();

            if (authStore.user) {
                const { showToast } = useShowToast();
                authStore.clearSessionTimer();
                authStore.$reset();

                showToast('warn', 'logout', 'user');

                router.push({ name: 'login' });
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
