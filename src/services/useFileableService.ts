// src/services/useFileableService.ts
import apiClient from '@/services/axios';

interface ProfilePictureResponse {
    profile_image: string | null;
    message?: string;
}

export const useFileableService = {
    async uploadProfilePicture(file: File): Promise<ProfilePictureResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post<ProfilePictureResponse>('/api/admin/myaccount/profilepicture/upload', formData, {
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
