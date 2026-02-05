// src/services/useCityService.ts
import apiClient from '@/services/axios';
import type { CitiesFilterParams, CitiesResponse, CityFormData, CityApiResponse, ToggleActiveCityResponse, DeleteCitiesResponse } from '@/types/city';

export const useCityService = {
    async getCities(params: CitiesFilterParams = {}): Promise<CitiesResponse> {
        try {
            const response = await apiClient.post<CitiesResponse>('/api/admin/cities/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeCity(cityData: CityFormData): Promise<CityApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<CityApiResponse>('/api/admin/cities', cityData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCity(cityId: number, updatedData: Partial<CityFormData>): Promise<CityApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<CityApiResponse>(`/api/admin/cities/${cityId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveCity(cityId: number): Promise<ToggleActiveCityResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveCityResponse>(`/api/admin/cities/${cityId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteCities(cityIds: number[]): Promise<DeleteCitiesResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteCitiesResponse>('/api/admin/cities', { data: { cities: cityIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
