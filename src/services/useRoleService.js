// services/useRoleService.js
import apiClient from '@/services/axios';

export const useRoleService = {
    async getRoles() {
        try {
            const response = await apiClient.get('/api/admin/roles');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeRole(roleData) {
        try {
            const response = await apiClient.post('/api/admin/roles', roleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateRole(roleId, updatedData) {
        try {
            const response = await apiClient.put(`/api/admin/roles/${roleId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteRoles(roleIds) {
        try {
            const response = await apiClient.delete('/api/admin/roles', { ids: roleIds });
            return response.data.deletedIds;
        } catch (error) {
            console.error('Failed to delete roles:', error);
            throw error;
        }
    }
};
