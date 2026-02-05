// src/services/useRegionService.ts
import apiClient from '@/services/axios';
import type { RegionsFilterParams, RegionsResponse, AllRegionsResponse, RegionCitiesResponse, RegionFormData, RegionApiResponse, ToggleActiveRegionResponse, DeleteRegionsResponse } from '@/types/region';

export const useRegionService = {
    async getRegions(params: RegionsFilterParams = {}): Promise<RegionsResponse> {
        try {
            const response = await apiClient.post<RegionsResponse>('/api/admin/regions/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Fetch a simple list of all regions (no filters)
    async getAllRegions(): Promise<AllRegionsResponse> {
        try {
            const response = await apiClient.get<AllRegionsResponse>('/api/admin/allregions');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Fetch cities for a given region id
    async getRegionCities(regionId: number): Promise<RegionCitiesResponse> {
        try {
            const response = await apiClient.get<RegionCitiesResponse>(`/api/admin/region/${regionId}/cities`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeRegion(regionData: RegionFormData): Promise<RegionApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<RegionApiResponse>('/api/admin/regions', regionData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateRegion(regionId: number, updatedData: Partial<RegionFormData>): Promise<RegionApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<RegionApiResponse>(`/api/admin/regions/${regionId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveRegion(regionId: number): Promise<ToggleActiveRegionResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveRegionResponse>(`/api/admin/regions/${regionId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteRegions(regionIds: number[]): Promise<DeleteRegionsResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteRegionsResponse>('/api/admin/regions', { data: { regions: regionIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
