// src/services/useRegionService.js
import apiClient from '@/services/axios';

export const useRegionService = {
    async getRegions(params) {
        try {
            const response = await apiClient.post('/api/admin/regions/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeRegion(regionData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/regions', regionData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateRegion(regionId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/regions/${regionId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveRegion(regionId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/regions/${regionId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteRegions(regionIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/regions', { data: { regions: regionIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
