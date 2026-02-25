// src/services/useRegionService.ts
import apiClient from '@/services/axios';
import type { RegionsFilterParams, RegionsResponse, AllRegionsResponse, RegionCitiesResponse, RegionFormData, RegionApiResponse, ToggleActiveRegionResponse, DeleteRegionsResponse } from '@/types/region';

export const useRegionService = {
    async getRegions(params: RegionsFilterParams = {}): Promise<RegionsResponse> {
        const response = await apiClient.post<RegionsResponse>('/api/admin/regions/filter', { params });
        return response.data;
    },

    // Fetch a simple list of all regions (no filters)
    async getAllRegions(): Promise<AllRegionsResponse> {
        const response = await apiClient.get<AllRegionsResponse>('/api/admin/allregions');
        return response.data;
    },

    // Fetch cities for a given region id
    async getRegionCities(regionId: number): Promise<RegionCitiesResponse> {
        const response = await apiClient.get<RegionCitiesResponse>(`/api/admin/region/${regionId}/cities`);
        return response.data;
    },

    async storeRegion(regionData: RegionFormData): Promise<RegionApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<RegionApiResponse>('/api/admin/regions', regionData);
        return response.data;
    },

    async updateRegion(regionId: number, updatedData: Partial<RegionFormData>): Promise<RegionApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<RegionApiResponse>(`/api/admin/regions/${regionId}`, updatedData);
        return response.data;
    },

    async toggleActiveRegion(regionId: number): Promise<ToggleActiveRegionResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<ToggleActiveRegionResponse>(`/api/admin/regions/${regionId}/toggle`);
        return response.data;
    },

    async deleteRegions(regionIds: number[]): Promise<DeleteRegionsResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteRegionsResponse>('/api/admin/regions', { data: { regions: regionIds } });
        return response.data;
    }
};
