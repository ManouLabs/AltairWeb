// src/services/useSubscriptionService.ts
import apiClient from '@/services/axios';
import type { SubscriptionsFilterParams, SubscriptionsResponse, SubscriptionFormData, SubscriptionApiResponse, DeleteSubscriptionsResponse, ToggleActiveSubscriptionResponse } from '@/types/subscription';

export const useSubscriptionService = {
    async getSubscriptions(params: SubscriptionsFilterParams = {}): Promise<SubscriptionsResponse> {
        const response = await apiClient.post<SubscriptionsResponse>('/api/admin/subscriptions/filter', { params });
        return response.data;
    },

    async storeSubscription(data: SubscriptionFormData): Promise<SubscriptionApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<SubscriptionApiResponse>('/api/admin/subscriptions', data);
        return response.data;
    },

    async updateSubscription(subscriptionId: number, data: Partial<SubscriptionFormData>): Promise<SubscriptionApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<SubscriptionApiResponse>(`/api/admin/subscriptions/${subscriptionId}`, data);
        return response.data;
    },

    async deleteSubscriptions(subscriptionIds: number[]): Promise<DeleteSubscriptionsResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteSubscriptionsResponse>('/api/admin/subscriptions', { data: { subscriptions: subscriptionIds } });
        return response.data;
    },

    async toggleActiveSubscription(subscriptionId: number): Promise<ToggleActiveSubscriptionResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleActiveSubscriptionResponse>(`/api/admin/subscriptions/${subscriptionId}/toggle`);
        return response.data;
    },

    async bulkUpdate(ids: number[], field: string, value: boolean): Promise<{ message: string }> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<{ message: string }>('/api/admin/subscriptions/bulk-update', { ids, field, value });
        return response.data;
    }
};
