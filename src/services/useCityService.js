// src/services/useCityService.js
import apiClient from '@/services/axios';

export const useCityService = {
    async getCities(params) {
        try {
            const response = await apiClient.post('/api/admin/cities/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeCity(cityData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/cities', cityData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCity(cityId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/cities/${cityId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveCity(cityId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/cities/${cityId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteCities(cityIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/cities', { data: { cities: cityIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
