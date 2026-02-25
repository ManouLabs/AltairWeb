// src/services/useFileableService.ts
import apiClient from '@/services/axios';
import type { UploadProfilePictureResponse } from '@/types/myaccount';

export const useFileableService = {
    async uploadProfilePicture(file: File): Promise<UploadProfilePictureResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<UploadProfilePictureResponse>('/api/admin/myaccount/profilepicture/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};
