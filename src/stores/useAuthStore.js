// src/stores/useAuthStore.js
import router from '@/router';
import apiClient from '@/services/axios';
import { redirectUser } from '@/utilities/auth';
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        errors: {},
        permissions: []
    }),
    persist: {
        paths: ['user', 'permissions']
    },
    actions: {
        async login(email, password) {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/login', { email, password });
                await this.fetchUser();
                await useSettingStore().fetchSettings();
            } catch (error) {
                this.processError(error, 'Login failed');
                throw error;
            }
        },
        async fetchUser() {
            try {
                const response = await apiClient.get('/api/user');
                this.user = response.data.user;
                this.permissions = response.data.permissions || [];
            } catch (error) {
                this.$reset();
                router.push('/auth/login');
                throw error;
            }
        },
        async myaccount() {
            try {
                router.push('/admin/myaccount');
            } catch (error) {
                this.processError(error, 'Logout failed');
                throw error;
            }
        },
        async logout() {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/logout');
            } catch (error) {
                // Don't rethrow on session loss
                if (![401, 419].includes(error.response?.status)) {
                    throw error;
                }
            } finally {
                this.stopListening?.();
                this.$reset();
                router.push('/auth/login');
            }
        },
        hasPermission(permission) {
            if (this.user?.roles?.includes('Super Admin')) {
                return true;
            }
            return this.permissions.includes(permission);
        },
        listenToSessionEvents() {
            if (this.user?.id) {
                Echo.private(`App.Models.User.${this.user.id}`).listen('SessionExpired', () => {
                    this.logout();
                });
            }
        },
        stopListening() {
            if (this.user?.id) {
                Echo.leave(`App.Models.User.${this.user.id}`);
            }
        },
        redirectUser() {
            redirectUser(this.permissions);
        },
        processError(error, defaultMessage) {
            this.errors = error.response?.data?.errors || {
                general: defaultMessage || 'An unexpected error occurred'
            };
        }
    }
});
