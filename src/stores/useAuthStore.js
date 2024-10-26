// stores/useAuthStore.js
import apiClient from '@/service/axios';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null, // Store the user info if needed
        isAuthenticated: false, // Tracks if the user is logged in
        errors: {}
    }),

    actions: {
        async login(email, password) {
            try {
                // Step 1: Get the CSRF cookie from Sanctum
                await apiClient.get('sanctum/csrf-cookie');

                // Step 2: Send login request to the API
                await apiClient.post('login', {
                    email: email,
                    password: password
                });

                // Step 3: Set authenticated status
                this.isAuthenticated = true;

                // Optionally, fetch user data after login
                await this.fetchUser();
            } catch (error) {
                this.errors = error.response.data.errors;
                throw new Error(error);
            }
        },

        async fetchUser() {
            try {
                const response = await apiClient.get('/api/user'); // Adjust API endpoint as needed
                this.user = response.data;
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        },

        logout() {
            this.user = null;
            this.isAuthenticated = false;
        }
    },
    persist: {
        enabled: true, // This will enable persistence for this store
        strategies: [
            {
                key: 'auth',
                storage: localStorage
            },
            {
                key: 'settings',
                storage: localStorage
            }
        ]
    }
});
