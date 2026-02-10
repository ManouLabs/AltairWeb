// src/services/axios.ts
import { useAuthStore } from '@/stores/useAuthStore';
import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
    withXSRFToken: true
});

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const method = (config.method || '').toLowerCase();
            const isMutating = method && method !== 'get';
            const socketId = typeof window !== 'undefined' ? window?.Echo?.socketId?.() : undefined;

            if (isMutating && socketId) {
                if (!config.headers) config.headers = {} as InternalAxiosRequestConfig['headers'];
                const hasHeader = config.headers['X-Socket-Id'];
                if (!hasHeader) {
                    config.headers['X-Socket-Id'] = socketId;
                }
            }
        } catch (_) {
            // Silently ignore errors
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;
        if (status && [401, 403, 419].includes(status)) {
            const authStore = useAuthStore();
            authStore.handleSessionExpired();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
