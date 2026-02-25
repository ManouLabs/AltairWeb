// src/services/useShipperService.ts
import apiClient from '@/services/axios';
import type { DeleteShippersResponse, ShipperApiResponse, ShipperFormData, ShippersFilterParams, ShippersResponse, ToggleActiveShipperResponse } from '@/types/shipper';

export const useShipperService = {
    async getShippers(params: ShippersFilterParams = {}): Promise<ShippersResponse> {
        const response = await apiClient.post<ShippersResponse>('/api/admin/shippers/filter', { params });
        return response.data;
    },

    async getShipper(shipperId: number): Promise<ShipperApiResponse> {
        const response = await apiClient.get<ShipperApiResponse>(`/api/admin/shippers/${shipperId}`);
        return response.data;
    },

    async storeShipper(shipperData: ShipperFormData): Promise<ShipperApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<ShipperApiResponse>('/api/admin/shippers', shipperData);
        return response.data;
    },

    async updateShipper(shipperId: number, updatedData: Partial<ShipperFormData>): Promise<ShipperApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<ShipperApiResponse>(`/api/admin/shippers/${shipperId}`, updatedData);
        return response.data;
    },

    async toggleActiveShipper(shipperId: number): Promise<ToggleActiveShipperResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleActiveShipperResponse>(`/api/admin/shippers/${shipperId}/toggle`);
        return response.data;
    },

    async deleteShippers(shippersIds: number[]): Promise<DeleteShippersResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteShippersResponse>('/api/admin/shippers', { data: { shippers: shippersIds } });
        return response.data;
    }
};
