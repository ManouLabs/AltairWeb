// src/stores/useAuthStore.js
import router from '@/router';
import apiClient from '@/services/axios';
import { redirectUser } from '@/utilities/auth';
import { defineStore } from 'pinia';
import { useSettingStore } from './useSettingStore';

let sessionTimeout = null;

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        errors: {},
        permissions: [],
        sessionLifetime: parseInt(import.meta.env.VITE_LIFETIME_SESSION) || 15 // in minutes
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

                this.startSessionTimer();
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
                this.forceLogout(); // handles full reset and redirect
                throw error;
            }
        },

        async logout() {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/logout');
            } catch (error) {
                if (![401, 419].includes(error.response?.status)) {
                    throw error;
                }
            } finally {
                this.forceLogout();
            }
        },

        async myaccount() {
            router.push('/admin/myaccount');
        },

        hasPermission(permission) {
            return this.user?.roles?.includes('Super Admin') || this.permissions.includes(permission);
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
        },

        // 🔐 Session timer logic
        startSessionTimer() {
            this.clearSessionTimer();
            sessionTimeout = setTimeout(
                () => {
                    this.handleSessionExpired();
                },
                this.sessionLifetime * 60 * 1000
            );
        },

        clearSessionTimer() {
            if (sessionTimeout) {
                clearTimeout(sessionTimeout);
                sessionTimeout = null;
            }
        },

        resetSessionTimerFromAction() {
            if (this.user) {
                this.startSessionTimer();
            }
        },

        handleSessionExpired() {
            this.clearSessionTimer();
            this.$reset();
            router.push({ name: 'login' });
        },

        forceLogout() {
            this.stopListening();
            this.clearSessionTimer();
            this.$reset();
            router.push({ name: 'login' });
        }
    }
});
