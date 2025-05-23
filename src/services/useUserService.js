// src/services/useUserService.js
import apiClient from '@/services/axios';

export const useUserService = {
    async getUsers(params) {
        try {
            const response = await apiClient.post('/api/admin/users/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeUser(userData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/users', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateUser(userId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/users/${userId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteUsers(usersIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/users', { data: { users: usersIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
