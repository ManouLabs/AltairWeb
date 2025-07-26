// src/services/useMyAccountService.js
import apiClient from '@/services/axios';

export const useMyAccountService = {
    async getUser() {
        try {
            const response = await apiClient.post('/api/admin/roles/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updatePassword(updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/myaccount/password`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateMyInformation(updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/myaccount/myinformation`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteRoles(rolesIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/roles', { data: { roles: rolesIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
