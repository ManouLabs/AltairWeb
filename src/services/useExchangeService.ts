// src/services/useExchangeService.ts
import apiClient from '@/services/axios';
import type { DeleteExchangesResponse, ExchangeApiResponse, ExchangeFormData, ExchangesResponse } from '@/types/exchange';

export const useExchangeService = {
    async getExchanges(params: Record<string, unknown> = {}): Promise<ExchangesResponse> {
        const response = await apiClient.post<ExchangesResponse>('/api/admin/exchanges/filter', { params });
        return response.data;
    },

    async getExchange(exchangeId: number): Promise<ExchangeApiResponse> {
        const response = await apiClient.get<ExchangeApiResponse>(`/api/admin/exchanges/${exchangeId}`);
        return response.data;
    },

    async storeExchange(exchangeData: ExchangeFormData): Promise<ExchangeApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<ExchangeApiResponse>('/api/admin/exchanges', exchangeData);
        return response.data;
    },

    async updateExchange(exchangeId: number, updatedData: Partial<ExchangeFormData> & { status?: string }): Promise<ExchangeApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<ExchangeApiResponse>(`/api/admin/exchanges/${exchangeId}`, updatedData);
        return response.data;
    },

    async deleteExchanges(exchangeIds: number[]): Promise<DeleteExchangesResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteExchangesResponse>('/api/admin/exchanges', { data: { exchanges: exchangeIds } });
        return response.data;
    }
};
