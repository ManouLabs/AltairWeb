// stores/useAuthStore.js
import apiClient from '@/service/axios';
import { defineStore } from 'pinia';

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
                this.errors = error.response?.data?.errors || { general: 'Login failed' };
                console.error('Login error:', this.errors);
                throw error;
            }
        },

        async fetchUser() {
            try {
                const response = await apiClient.get('/api/user');
                this.user = response.data;
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        },

        async logout() {
            try {
                await apiClient.get('/sanctum/csrf-cookie');
                await apiClient.post('/logout');

                this.$reset();
            } catch (error) {
                this.errors = error.response?.data?.errors || { general: 'Logout failed' };
                console.error('Logout error:', this.errors);
                throw error;
            }
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                key: 'auth',
                storage: localStorage,
                paths: ['user', 'isAuthenticated']
            }
        ]
    }
});
