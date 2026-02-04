// src/services/useShipperService.ts
import apiClient from '@/services/axios';
import type { DeleteShippersResponse, ShipperApiResponse, ShipperFormData, ShippersFilterParams, ShippersResponse, ToggleActiveShipperResponse } from '@/types/shipper';

export const useShipperService = {
    async getShippers(params: ShippersFilterParams = {}): Promise<ShippersResponse> {
        try {
            const response = await apiClient.post<ShippersResponse>('/api/admin/shippers/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getShipper(shipperId: number): Promise<ShipperApiResponse> {
        try {
            const response = await apiClient.get<ShipperApiResponse>(`/api/admin/shippers/${shipperId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeShipper(shipperData: ShipperFormData): Promise<ShipperApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<ShipperApiResponse>('/api/admin/shippers', shipperData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateShipper(shipperId: number, updatedData: Partial<ShipperFormData>): Promise<ShipperApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<ShipperApiResponse>(`/api/admin/shippers/${shipperId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveShipper(shipperId: number): Promise<ToggleActiveShipperResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveShipperResponse>(`/api/admin/shippers/${shipperId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteShippers(shippersIds: number[]): Promise<DeleteShippersResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteShippersResponse>('/api/admin/shippers', { data: { shippers: shippersIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
