// src/services/useSupplierService.ts
import apiClient from '@/services/axios';
import type { DeleteSuppliersResponse, SupplierApiResponse, SupplierFormData, SuppliersResponse } from '@/types/supplier';

export const useSupplierService = {
    async getSuppliers(params: Record<string, unknown> = {}): Promise<SuppliersResponse> {
        const response = await apiClient.post<SuppliersResponse>('/api/admin/suppliers/filter', { params });
        return response.data;
    },

    async getSupplier(supplierId: number): Promise<SupplierApiResponse> {
        const response = await apiClient.get<SupplierApiResponse>(`/api/admin/suppliers/${supplierId}`);
        return response.data;
    },

    async storeSupplier(supplierData: SupplierFormData | FormData): Promise<SupplierApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const isFormData = supplierData instanceof FormData;
        const response = await apiClient.post<SupplierApiResponse>('/api/admin/suppliers', supplierData, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
        return response.data;
    },

    async updateSupplier(supplierId: number, updatedData: Partial<SupplierFormData> | FormData): Promise<SupplierApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const isFormData = updatedData instanceof FormData;
        if (isFormData) {
            updatedData.append('_method', 'PUT');
            const response = await apiClient.post<SupplierApiResponse>(`/api/admin/suppliers/${supplierId}`, updatedData, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data;
        }
        const response = await apiClient.put<SupplierApiResponse>(`/api/admin/suppliers/${supplierId}`, updatedData);
        return response.data;
    },

    async deleteSuppliers(supplierIds: number[]): Promise<DeleteSuppliersResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteSuppliersResponse>('/api/admin/suppliers', { data: { suppliers: supplierIds } });
        return response.data;
    }
};
