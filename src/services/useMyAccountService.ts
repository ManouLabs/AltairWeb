// src/services/useMyAccountService.ts
import apiClient from '@/services/axios';
import type { ActivitiesResponse, UpdateMyInformationData, UpdateMyInformationResponse, UpdatePasswordData, UpdatePasswordResponse, DeleteAccountData, DeleteAccountResponse } from '@/types/myaccount';

export const useMyAccountService = {
    async getActivities(page: number = 1): Promise<ActivitiesResponse> {
        try {
            const response = await apiClient.get<ActivitiesResponse>('/api/admin/myaccount/activities', {
                params: { page }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updatePassword(updatedData: UpdatePasswordData): Promise<UpdatePasswordResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<UpdatePasswordResponse>('/api/admin/myaccount/password', updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateMyInformation(updatedData: UpdateMyInformationData): Promise<UpdateMyInformationResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<UpdateMyInformationResponse>('/api/admin/myaccount/myinformation', updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteMyAccount(values: DeleteAccountData): Promise<DeleteAccountResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteAccountResponse>('/api/admin/myaccount/deletemyaccount', {
                data: values
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
