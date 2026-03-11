// src/services/useAttributeService.ts
import apiClient from '@/services/axios';
import type { AttributeFormData, AttributesResponse, AttributeApiResponse, DeleteAttributesResponse, ToggleActiveAttributeResponse } from '@/types/attribute';

export const useAttributeService = {
    async getAttributes(params: Record<string, unknown> = {}): Promise<AttributesResponse> {
        const response = await apiClient.post<AttributesResponse>('/api/admin/attributes/filter', { params });
        return response.data;
    },

    async getAttribute(attributeId: number): Promise<AttributeApiResponse> {
        const response = await apiClient.get<AttributeApiResponse>(`/api/admin/attributes/${attributeId}`);
        return response.data;
    },

    async storeAttribute(attributeData: AttributeFormData): Promise<AttributeApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<AttributeApiResponse>('/api/admin/attributes', attributeData);
        return response.data;
    },

    async updateAttribute(attributeId: number, updatedData: Partial<AttributeFormData>): Promise<AttributeApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<AttributeApiResponse>(`/api/admin/attributes/${attributeId}`, updatedData);
        return response.data;
    },

    async toggleActiveAttribute(attributeId: number): Promise<ToggleActiveAttributeResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleActiveAttributeResponse>(`/api/admin/attributes/${attributeId}/toggle`);
        return response.data;
    },

    async deleteAttributes(attributeIds: number[]): Promise<DeleteAttributesResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteAttributesResponse>('/api/admin/attributes', {
            data: { attributes: attributeIds }
        });
        return response.data;
    },

    async bulkUpdate(ids: number[], field: string, value: boolean): Promise<{ message: string }> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<{ message: string }>('/api/admin/attributes/bulk-update', { ids, field, value });
        return response.data;
    }
};
