// src/services/useMyAccountService.js
import apiClient from '@/services/axios';

export const useMyAccountService = {
    async getActivities() {
        try {
            const response = await apiClient.get('/api/admin/myaccount/activities');
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

    async deleteMyAccount(values) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete(`/api/admin/myaccount/deletemyaccount`, {
                data: values
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
