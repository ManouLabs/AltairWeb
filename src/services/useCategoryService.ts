// src/services/useCategoryService.ts
import apiClient from '@/services/axios';
import type { CategoryFormData, CategoriesResponse, CategoryApiResponse, DeleteCategoriesResponse, ToggleActiveCategoryResponse } from '@/types/category';

interface FilterParams {
    [key: string]: unknown;
}

export const useCategoryService = {
    async getCategories(params: FilterParams = {}): Promise<CategoriesResponse> {
        try {
            const response = await apiClient.post<CategoriesResponse>('/api/admin/categories/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getAllCategories(): Promise<CategoriesResponse> {
        try {
            const response = await apiClient.get<CategoriesResponse>('/api/admin/allcategories');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getCategoryTree(): Promise<CategoriesResponse> {
        try {
            const response = await apiClient.get<CategoriesResponse>('/api/admin/categories/tree');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeCategory(categoryData: CategoryFormData): Promise<CategoryApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<CategoryApiResponse>('/api/admin/categories', categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCategory(categoryId: number, updatedData: Partial<CategoryFormData>): Promise<CategoryApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<CategoryApiResponse>(`/api/admin/categories/${categoryId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveCategory(categoryId: number): Promise<ToggleActiveCategoryResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveCategoryResponse>(`/api/admin/categories/${categoryId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteCategories(categoryIds: number[]): Promise<DeleteCategoriesResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteCategoriesResponse>('/api/admin/categories', {
                data: { categories: categoryIds }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
