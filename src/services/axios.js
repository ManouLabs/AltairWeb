import router from '@/router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import axios from 'axios';

// Create an axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
    withXSRFToken: true
});

// Reusable loading functions
const startPageLoading = () => useLoading().startPageLoading();
const stopPageLoading = () => useLoading().stopPageLoading();

// Axios request interceptor
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

// Axios response interceptor
apiClient.interceptors.response.use(
    (response) => {
        stopPageLoading();
        return response;
    },
    async (error) => {
        stopPageLoading();

        // Handle 401 error by updating auth state
        if (error.status === 401) {
            const authStore = useAuthStore();
            authStore.user = null;
            router.push({ name: 'login' });
        }
        return Promise.reject(error);
    }
);

export default apiClient;
