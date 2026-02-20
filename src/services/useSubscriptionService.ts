// src/services/useSubscriptionService.ts
import apiClient from '@/services/axios';
import type { SubscriptionsFilterParams, SubscriptionsResponse, SubscriptionFormData, SubscriptionApiResponse, DeleteSubscriptionsResponse, ToggleActiveSubscriptionResponse } from '@/types/subscription';

export const useSubscriptionService = {
    async getSubscriptions(params: SubscriptionsFilterParams = {}): Promise<SubscriptionsResponse> {
        try {
            const response = await apiClient.post<SubscriptionsResponse>('/api/admin/subscriptions/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeSubscription(data: SubscriptionFormData): Promise<SubscriptionApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<SubscriptionApiResponse>('/api/admin/subscriptions', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateSubscription(subscriptionId: number, data: Partial<SubscriptionFormData>): Promise<SubscriptionApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<SubscriptionApiResponse>(`/api/admin/subscriptions/${subscriptionId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteSubscriptions(subscriptionIds: number[]): Promise<DeleteSubscriptionsResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteSubscriptionsResponse>('/api/admin/subscriptions', { data: { subscriptions: subscriptionIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveSubscription(subscriptionId: number): Promise<ToggleActiveSubscriptionResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveSubscriptionResponse>(`/api/admin/subscriptions/${subscriptionId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
