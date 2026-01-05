// src/services/useShopService.js
import apiClient from '@/services/axios';

export const useShopService = {
    async getShops(params) {
        try {
            const response = await apiClient.post('/api/admin/shops/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeShop(shopData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/shops', shopData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateShop(shopId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/shops/${shopId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteShops(shopsIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/shops', { data: { shops: shopsIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
