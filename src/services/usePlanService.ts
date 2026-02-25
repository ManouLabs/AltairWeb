// src/services/usePlanService.ts
import apiClient from '@/services/axios';
import type { PlansFilterParams, PlansResponse, PlanFormData, PlanApiResponse, ToggleActivePlanResponse, ToggleRecommendedPlanResponse, DeletePlansResponse } from '@/types/plan';

export const usePlanService = {
    async getPlans(params: PlansFilterParams = {}): Promise<PlansResponse> {
        const response = await apiClient.post<PlansResponse>('/api/admin/plans/filter', { params });
        return response.data;
    },

    async storePlan(planData: PlanFormData): Promise<PlanApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<PlanApiResponse>('/api/admin/plans', planData);
        return response.data;
    },

    async updatePlan(planId: number, updatedData: Partial<PlanFormData>): Promise<PlanApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<PlanApiResponse>(`/api/admin/plans/${planId}`, updatedData);
        return response.data;
    },

    async toggleActivePlan(planId: number): Promise<ToggleActivePlanResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleActivePlanResponse>(`/api/admin/plans/${planId}/toggle`);
        return response.data;
    },

    async toggleRecommendedPlan(planId: number): Promise<ToggleRecommendedPlanResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleRecommendedPlanResponse>(`/api/admin/plans/${planId}/toggle-recommended`);
        return response.data;
    },

    async deletePlans(planIds: number[]): Promise<DeletePlansResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeletePlansResponse>('/api/admin/plans', { data: { plans: planIds } });
        return response.data;
    }
};
