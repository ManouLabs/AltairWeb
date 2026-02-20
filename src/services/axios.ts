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
        if (status && [401, 419].includes(status)) {
            const authStore = useAuthStore();
            authStore.handleSessionExpired();
        }

        // Handle quota exceeded errors (403 with quota payload)
        if (status === 403) {
            const data = error.response?.data as Record<string, unknown> | undefined;
            if (data?.quota) {
                const quota = data.quota as { resource: string; used: number; limit: number };
                try {
                    const { useToast } = await import('primevue/usetoast');
                    const toast = useToast();
                    toast.add({
                        severity: 'error',
                        summary: 'Quota Exceeded',
                        detail: (data.message as string) || `You've reached the limit for ${quota.resource} (${quota.used}/${quota.limit}).`,
                        life: 8000,
                        group: 'tc'
                    });
                } catch {
                    // Toast may not be available outside component context
                }
                // Refresh quota store to reflect latest state
                const { useQuotaStore } = await import('@/stores/useQuotaStore');
                const quotaStore = useQuotaStore();
                quotaStore.refreshQuotas();
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
