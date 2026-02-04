// src/services/useUserService.ts
import apiClient from '@/services/axios';
import type { User, UserFormData, UsersResponse, UserApiResponse, DeleteUsersResponse } from '@/types/user';

interface FilterParams {
    [key: string]: unknown;
}

export const useUserService = {
    async getUsers(params: FilterParams): Promise<UsersResponse> {
        try {
            const response = await apiClient.post<UsersResponse>('/api/admin/users/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeUser(userData: UserFormData): Promise<UserApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<UserApiResponse>('/api/admin/users', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateUser(userId: number, updatedData: Partial<UserFormData>): Promise<UserApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<UserApiResponse>(`/api/admin/users/${userId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteUsers(usersIds: number[]): Promise<DeleteUsersResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteUsersResponse>('/api/admin/users', { data: { users: usersIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
