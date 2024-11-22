// services/useRoleService.js
import apiClient from '@/services/axios';

export const useRoleService = {
    async getRoles() {
        try {
            const response = await apiClient.get('/api/admin/roles');
            return response.data;
        } catch (error) {
            console.error('Fetch roles:', error);
            throw error;
        }
    },

    async storeRole(roleData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/roles', roleData);
            return response.data;
        } catch (error) {
            console.error('Store roles:', error.response.data);
            throw error;
        }
    },

    async updateRole(roleId, updatedData) {
        const response = await apiClient.put(`/api/admin/roles/${roleId}`, updatedData);
        return response.data;
    },

    async deleteRoles(roleIds) {
        const response = await apiClient.delete('/api/admin/roles', {
            data: { ids: roleIds }
        });
        return response.data.deletedIds;
    }
};
