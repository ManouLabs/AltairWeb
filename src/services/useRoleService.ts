// src/services/useRoleService.ts
import apiClient from '@/services/axios';
import type { RoleFormData, RolesResponse, RoleApiResponse, DeleteRolesResponse } from '@/types/role';

interface FilterParams {
    [key: string]: unknown;
}

export const useRoleService = {
    async getRoles(params: FilterParams): Promise<RolesResponse> {
        try {
            const response = await apiClient.post<RolesResponse>('/api/admin/roles/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeRole(roleData: RoleFormData): Promise<RoleApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<RoleApiResponse>('/api/admin/roles', roleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateRole(roleId: number, updatedData: Partial<RoleFormData>): Promise<RoleApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<RoleApiResponse>(`/api/admin/roles/${roleId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteRoles(rolesIds: number[]): Promise<DeleteRolesResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteRolesResponse>('/api/admin/roles', { data: { roles: rolesIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
