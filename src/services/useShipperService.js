// src/services/useShipperService.js
import apiClient from '@/services/axios';

export const useShipperService = {
    async getShippers(params = {}) {
        try {
            const response = await apiClient.post('/api/admin/shippers/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getShipper(shipperId) {
        try {
            const response = await apiClient.get(`/api/admin/shippers/${shipperId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeShipper(shipperData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/shippers', shipperData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateShipper(shipperId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/shippers/${shipperId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveShipper(shipperId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/shippers/${shipperId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteShippers(shippersIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/shippers', { data: { shippers: shippersIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
