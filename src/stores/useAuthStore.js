// stores/useAuthStore.js
import axios from 'axios';
import { defineStore } from 'pinia';

axios.defaults.baseURL = 'localhost:8000';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null, // Store the user info if needed
        isAuthenticated: false // Tracks if the user is logged in
    }),

    actions: {
        async login(email, password) {
            try {
                // Step 1: Get the CSRF cookie from Sanctum
                await axios.get('http://localhost:8000/sanctum/csrf-cookie');

                // Step 2: Send login request to the API
                await axios.post('http://localhost:8000/login', {
                    email: email,
                    password: password
                });

                // Step 3: Set authenticated status
                this.isAuthenticated = true;

                // Optionally, fetch user data after login
                await this.fetchUser();
            } catch (error) {
                throw new Error('Login failed: ' + error.response?.data?.message || error.message);
            }
        },

        async fetchUser() {
            try {
                const response = await axios.get('http://localhost:8000/user'); // Adjust API endpoint as needed
                this.user = response.data;
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        },

        logout() {
            this.user = null;
            this.isAuthenticated = false;
            localStorage.removeItem('token'); // If storing token
        }
    }
});
