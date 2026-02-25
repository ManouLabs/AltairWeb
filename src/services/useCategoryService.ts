// src/services/useCategoryService.ts
import apiClient from '@/services/axios';
import type { CategoryFormData, CategoriesResponse, CategoryApiResponse, DeleteCategoriesResponse, ToggleActiveCategoryResponse } from '@/types/category';

export const useCategoryService = {
    async getCategories(params: Record<string, unknown> = {}): Promise<CategoriesResponse> {
        const response = await apiClient.post<CategoriesResponse>('/api/admin/categories/filter', { params });
        return response.data;
    },

    async getAllCategories(): Promise<CategoriesResponse> {
        const response = await apiClient.get<CategoriesResponse>('/api/admin/allcategories');
        return response.data;
    },

    async getCategoryTree(): Promise<CategoriesResponse> {
        const response = await apiClient.get<CategoriesResponse>('/api/admin/categories/tree');
        return response.data;
    },

    async storeCategory(categoryData: CategoryFormData): Promise<CategoryApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<CategoryApiResponse>('/api/admin/categories', categoryData);
        return response.data;
    },

    async updateCategory(categoryId: number, updatedData: Partial<CategoryFormData>): Promise<CategoryApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<CategoryApiResponse>(`/api/admin/categories/${categoryId}`, updatedData);
        return response.data;
    },

    async toggleActiveCategory(categoryId: number): Promise<ToggleActiveCategoryResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleActiveCategoryResponse>(`/api/admin/categories/${categoryId}/toggle`);
        return response.data;
    },

    async deleteCategories(categoryIds: number[]): Promise<DeleteCategoriesResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteCategoriesResponse>('/api/admin/categories', {
            data: { categories: categoryIds }
        });
        return response.data;
    }
};
