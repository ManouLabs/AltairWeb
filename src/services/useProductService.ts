// src/services/useProductService.ts
import apiClient from '@/services/axios';
import type { ProductFormData, ProductsResponse, ProductApiResponse, DeleteProductsResponse, GenerateVariantsResponse } from '@/types/product';

export const useProductService = {
    async getProducts(params: Record<string, any>): Promise<ProductsResponse> {
        const response = await apiClient.post<ProductsResponse>('/api/admin/products/filter', { params });
        return response.data;
    },

    async getProductsList(search?: string, limit?: number): Promise<ProductsResponse> {
        const response = await apiClient.get<ProductsResponse>('/api/admin/products/active', {
            params: { search, limit }
        });
        return response.data;
    },

    async getProduct(id: number): Promise<ProductApiResponse> {
        const response = await apiClient.get<ProductApiResponse>(`/api/admin/products/${id}`);
        return response.data;
    },

    async storeProduct(data: ProductFormData | FormData): Promise<ProductApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const isFormData = data instanceof FormData;
        const response = await apiClient.post<ProductApiResponse>('/api/admin/products', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
        return response.data;
    },

    async updateProduct(id: number, data: ProductFormData | FormData): Promise<ProductApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const isFormData = data instanceof FormData;
        if (isFormData) {
            data.append('_method', 'PUT');
            const response = await apiClient.post<ProductApiResponse>(`/api/admin/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data;
        }
        const response = await apiClient.put<ProductApiResponse>(`/api/admin/products/${id}`, data);
        return response.data;
    },

    async deleteProducts(products: number[]): Promise<DeleteProductsResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteProductsResponse>('/api/admin/products', { data: { products } });
        return response.data;
    },

    async toggleActive(id: number): Promise<ProductApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ProductApiResponse>(`/api/admin/products/${id}/toggle`);
        return response.data;
    },

    async generateVariants(productId: number, attributeIds: number[], selectedValueIds: number[]): Promise<GenerateVariantsResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<GenerateVariantsResponse>(`/api/admin/products/${productId}/variants`, { attribute_ids: attributeIds, selected_value_ids: selectedValueIds });
        return response.data;
    },

    async bulkUpdate(ids: number[], field: string, value: boolean): Promise<{ message: string }> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<{ message: string }>('/api/admin/products/bulk-update', { ids, field, value });
        return response.data;
    }
};
