// src/services/useProductService.ts
import apiClient from '@/services/axios';
import type { ProductFormData, ProductsResponse, ProductApiResponse, DeleteProductsResponse, GenerateVariantsResponse } from '@/types/product';

const getProducts = async (params: Record<string, any>): Promise<ProductsResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.post('/api/admin/products/filter', { params });
    return response.data;
};

const getProduct = async (id: number): Promise<ProductApiResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.get(`/api/admin/products/${id}`);
    return response.data;
};

const storeProduct = async (data: ProductFormData | FormData): Promise<ProductApiResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const isFormData = data instanceof FormData;
    const response = await apiClient.post('/api/admin/products', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
    return response.data;
};

const updateProduct = async (id: number, data: ProductFormData | FormData): Promise<ProductApiResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const isFormData = data instanceof FormData;
    if (isFormData) {
        data.append('_method', 'PUT');
        const response = await apiClient.post(`/api/admin/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        return response.data;
    }
    const response = await apiClient.put(`/api/admin/products/${id}`, data);
    return response.data;
};

const deleteProducts = async (products: number[]): Promise<DeleteProductsResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    return await apiClient.delete('/api/admin/products', { data: { products } });
};

const toggleActive = async (id: number): Promise<ProductApiResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.patch(`/api/admin/products/${id}/toggle`);
    return response.data;
};

const generateVariants = async (productId: number, attributeIds: number[]): Promise<GenerateVariantsResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.post(`/api/admin/products/${productId}/variants`, { attribute_ids: attributeIds });
    return response.data;
};

const uploadImage = async (productId: number, file: File): Promise<ProductApiResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('_method', 'PUT');
    const response = await apiClient.post(`/api/admin/products/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const useProductService = {
    getProducts,
    getProduct,
    storeProduct,
    updateProduct,
    deleteProducts,
    toggleActive,
    generateVariants,
    uploadImage
};
