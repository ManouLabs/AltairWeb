// src/services/useRoleService.ts
import apiClient from '@/services/axios';
import type { RoleFormData, RolesResponse, RoleApiResponse, DeleteRolesResponse } from '@/types/role';

export const useRoleService = {
    async getRoles(params: Record<string, unknown> = {}): Promise<RolesResponse> {
        const response = await apiClient.post<RolesResponse>('/api/admin/roles/filter', { params });
        return response.data;
    },

    async storeRole(roleData: RoleFormData): Promise<RoleApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<RoleApiResponse>('/api/admin/roles', roleData);
        return response.data;
    },

    async updateRole(roleId: number, updatedData: Partial<RoleFormData>): Promise<RoleApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<RoleApiResponse>(`/api/admin/roles/${roleId}`, updatedData);
        return response.data;
    },

    async deleteRoles(rolesIds: number[]): Promise<DeleteRolesResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteRolesResponse>('/api/admin/roles', { data: { roles: rolesIds } });
        return response.data;
    }
};
