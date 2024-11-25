// stores/useAuthStore.js
import apiClient from '@/services/axios';
import { defineStore } from 'pinia';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isAuthenticated: false,
        errors: {},
        isAdmin: false,
        permissions: []
    }),

    actions: {
        async login(email, password) {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/login', { email, password });
                await this.fetchUser();
            } catch (error) {
                this.processError(error, 'Login failed');
                throw error;
            }
        },

        async fetchUser() {
            try {
                const response = await apiClient.get('/api/user');
                this.isAuthenticated = true;
                this.user = response.data.user;
                this.isAdmin = response.data.isAdmin;
                this.permissions = response.data.permissions;
            } catch (error) {
                if (error.response?.status === 401) {
                    router.push('/auth/login');
                } else {
                    this.processError(error, 'Fetch User Error');
                    throw error;
                }
            }
        },

        async logout() {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/logout');
                this.stopListening();
                this.$reset();
                router.push('/auth/login');
            } catch (error) {
                this.processError(error, 'Logout failed');
                throw error;
            }
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

        processError(error, defaultMessage) {
            this.errors = error.response?.data?.errors || {
                general: defaultMessage || 'An unexpected error occurred'
            };
        }
    }
});
