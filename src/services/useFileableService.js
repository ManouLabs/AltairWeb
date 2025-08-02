// src/services/useFileableService.js
import apiClient from '@/services/axios';

export const useFileableService = {
    async uploadProfilePicture(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/api/admin/myaccount/profilepicture/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
