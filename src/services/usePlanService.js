// src/services/usePlanService.js
import apiClient from '@/services/axios';

export const usePlanService = {
    async getPlans(params) {
        try {
            const response = await apiClient.post('/api/admin/plans/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storePlan(planData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/plans', planData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updatePlan(planId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/plans/${planId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActivePlan(planId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/plans/${planId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deletePlans(planIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/plans', { data: { plans: planIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
