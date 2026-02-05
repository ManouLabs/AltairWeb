// src/services/usePlanService.ts
import apiClient from '@/services/axios';
import type { PlansFilterParams, PlansResponse, PlanFormData, PlanApiResponse, ToggleActivePlanResponse, DeletePlansResponse } from '@/types/plan';

export const usePlanService = {
    async getPlans(params: PlansFilterParams = {}): Promise<PlansResponse> {
        try {
            const response = await apiClient.post<PlansResponse>('/api/admin/plans/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storePlan(planData: PlanFormData): Promise<PlanApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<PlanApiResponse>('/api/admin/plans', planData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updatePlan(planId: number, updatedData: Partial<PlanFormData>): Promise<PlanApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<PlanApiResponse>(`/api/admin/plans/${planId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActivePlan(planId: number): Promise<ToggleActivePlanResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActivePlanResponse>(`/api/admin/plans/${planId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deletePlans(planIds: number[]): Promise<DeletePlansResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeletePlansResponse>('/api/admin/plans', { data: { plans: planIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
