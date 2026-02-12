// src/services/useAttributeService.ts
import apiClient from '@/services/axios';
import type { AttributeFormData, AttributesResponse, AttributeApiResponse, DeleteAttributesResponse, ToggleActiveAttributeResponse } from '@/types/attribute';

interface FilterParams {
    [key: string]: unknown;
}

export const useAttributeService = {
    async getAttributes(params: FilterParams = {}): Promise<AttributesResponse> {
        try {
            const response = await apiClient.post<AttributesResponse>('/api/admin/attributes/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAttribute(attributeId: number): Promise<AttributeApiResponse> {
        try {
            const response = await apiClient.get<AttributeApiResponse>(`/api/admin/attributes/${attributeId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeAttribute(attributeData: AttributeFormData): Promise<AttributeApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<AttributeApiResponse>('/api/admin/attributes', attributeData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateAttribute(attributeId: number, updatedData: Partial<AttributeFormData>): Promise<AttributeApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<AttributeApiResponse>(`/api/admin/attributes/${attributeId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveAttribute(attributeId: number): Promise<ToggleActiveAttributeResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveAttributeResponse>(`/api/admin/attributes/${attributeId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteAttributes(attributeIds: number[]): Promise<DeleteAttributesResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteAttributesResponse>('/api/admin/attributes', {
                data: { attributes: attributeIds }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
