// src/stores/useAuthStore.ts
import router from '@/router';
import apiClient from '@/services/axios';
import { redirectUser } from '@/utilities/auth';
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';
import type { AxiosError } from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    profile_image?: string | null;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    last_login_ip?: string | null;
    account?: {
        plan?: {
            name?: string;
            limits?: Record<string, number>;
        };
        usage?: Record<string, number>;
    };
    [key: string]: unknown;
}

interface AuthState {
    user: User | null;
    errors: Record<string, string | string[] | null>;
    permissions: string[];
    sessionLifetime: number;
}

interface UserResponse {
    user: User;
    permissions: string[];
}

interface ErrorResponse {
    errors?: Record<string, string[]>;
    message?: string;
}

let sessionTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        errors: {},
        permissions: [],
        sessionLifetime: parseInt(import.meta.env.VITE_LIFETIME_SESSION as string) || 15 // in minutes
    }),
    persist: {
        pick: ['user', 'permissions']
    },
    getters: {
        isLoggedIn: (state): boolean => !!state.user
    },
    actions: {
        async login(email: string, password: string): Promise<void> {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/login', { email, password });

                await this.fetchUser();
                await useSettingStore().fetchSettings();

                this.startSessionTimer();
            } catch (error) {
                this.processError(error as AxiosError<ErrorResponse>, 'Login failed');
                throw error;
            }
        },

        async fetchUser(): Promise<void> {
            try {
                const response = await apiClient.get<UserResponse>('/api/user');
                this.user = response.data.user;
                this.permissions = response.data.permissions || [];
            } catch (error) {
                const axiosError = error as AxiosError;
                if (axiosError.response?.status === 401 || axiosError.response?.status === 419) {
                    this.handleSessionExpired();
                } else {
                    this.processError(axiosError as AxiosError<ErrorResponse>, 'Failed to fetch user data');
                }
                throw error;
            }
        },

        async logout(): Promise<void> {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/logout');
            } catch (error) {
                const axiosError = error as AxiosError;
                if (![401, 419].includes(axiosError.response?.status || 0)) {
                    throw error;
                }
            } finally {
                this.handleSessionExpired();
            }
        },

        async myaccount(): Promise<void> {
            router.push('/admin/myaccount');
        },

        clearErrors(fields: string[] = []): void {
            if (fields.length === 0) {
                this.errors = {};
            } else {
                for (const field of fields) {
                    this.errors[field] = null;
                }
            }
        },

        hasPermission(permission: string): boolean {
            return this.user?.roles?.includes('Super Admin') || this.permissions.includes(permission);
        },

        redirectUser(): void {
            redirectUser(this.permissions);
        },

        processError(error: AxiosError<ErrorResponse>, defaultMessage: string): void {
            this.errors = error.response?.data?.errors || {
                general: defaultMessage || 'An unexpected error occurred'
            };
        },

        startSessionTimer(): void {
            this.clearSessionTimer();
            sessionTimeout = setTimeout(
                () => {
                    this.logout();
                },
                this.sessionLifetime * 60 * 1000
            );
        },

        clearSessionTimer(): void {
            if (sessionTimeout) {
                clearTimeout(sessionTimeout);
                sessionTimeout = null;
            }
        },

        resetSessionTimerFromAction(): void {
            if (this.user) {
                this.startSessionTimer();
            }
        },

        handleSessionExpired(): void {
            this.clearSessionTimer();
            this.user = null;
            this.permissions = [];
            this.clearErrors();
            router.push({ name: 'login' });
        }
    }
});
