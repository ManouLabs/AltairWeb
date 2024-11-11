// stores/useAuthStore.js
import apiClient from '@/services/axios';
import { defineStore } from 'pinia';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isAuthenticated: false,
        errors: {}
    }),

    actions: {
        async login(email, password) {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/login', { email, password });
                this.isAuthenticated = true;
                await this.fetchUser();
            } catch (error) {
                this.processError(error, 'Login failed');
                throw error;
            }
        },

        async fetchUser() {
            try {
                const response = await apiClient.get('/api/user');
                this.user = response.data;
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
    },

    persist: {
        key: 'auth',
        storage: localStorage,
        pick: ['user', 'isAuthenticated']
    }
});
