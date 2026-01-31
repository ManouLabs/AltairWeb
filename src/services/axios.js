// src/services/axios.js
import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
    withXSRFToken: true
});

apiClient.interceptors.request.use(
    async (config) => {
        try {
            const method = (config.method || '').toLowerCase();
            const isMutating = method && method !== 'get';
            const socketId = typeof window !== 'undefined' ? window?.Echo?.socketId?.() : undefined;

            if (isMutating && socketId) {
                if (!config.headers) config.headers = {};
                const hasHeader = (typeof config.headers.get === 'function' && config.headers.get('X-Socket-Id')) || config.headers['X-Socket-Id'];
                if (!hasHeader) {
                    if (typeof config.headers.set === 'function') {
                        config.headers.set('X-Socket-Id', socketId);
                    } else {
                        config.headers['X-Socket-Id'] = socketId;
                    }
                }
            }
        } catch (_) {}

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const status = error.status;
        if ([401, 419].includes(status)) {
            const authStore = useAuthStore();

            authStore.handleSessionExpired();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
