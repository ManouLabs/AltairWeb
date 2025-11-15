// src/services/useAccountService.js
import apiClient from '@/services/axios';

export const useAccountService = {
    async getAccounts(params) {
        try {
            const response = await apiClient.post('/api/admin/accounts/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeAccount(accountData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/accounts', accountData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateAccount(accountId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/accounts/${accountId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveAccount(accountId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/accounts/${accountId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteAccounts(accountsIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/accounts', { data: { accounts: accountsIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
