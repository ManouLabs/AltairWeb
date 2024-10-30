// stores/userStore.js
import apiClient from '@/service/axios'; // Import the API client
import { defineStore } from 'pinia';

export const useUserStore = defineStore('userStore', {
    state: () => ({
        users: [] // Holds the list of users
    }),

    actions: {
        async fetchUsers() {
            try {
                const response = await apiClient.get('/api/users'); // Fetch users from the API
                this.users = response.data; // Update the store's state with the fetched users
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        },

        async addUser(userData) {
            try {
                const response = await apiClient.post('/api/users/create', userData); // Add a new user
                this.users.push(response.data); // Add the new user to the state
            } catch (error) {
                console.error('Failed to add user:', error);
            }
        },

        async updateUser(userId, updatedData) {
            try {
                await apiClient.put(`/api/users/${userId}`, updatedData); // Update the user
                const userIndex = this.users.findIndex((user) => user.id === userId);
                if (userIndex !== -1) {
                    this.users[userIndex] = { ...this.users[userIndex], ...updatedData };
                }
            } catch (error) {
                console.error('Failed to update user:', error);
            }
        },

        async deleteUser(userId) {
            try {
                await apiClient.delete(`/api/users/${userId}`); // Delete the user
                this.users = this.users.filter((user) => user.id !== userId);
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    }
});
