// src/services/useRoleService.js
import apiClient from '@/services/axios';

export const useRoleService = {
    async getRoles(params) {
        try {
            const response = await apiClient.post('/api/admin/roles/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeRole(roleData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/roles', roleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateRole(roleId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/roles/${roleId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteRoles(rolesIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/roles', { data: { roles: rolesIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
