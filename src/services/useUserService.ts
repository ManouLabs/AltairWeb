// src/services/useUserService.ts
import apiClient from '@/services/axios';
import type { UserFormData, UsersResponse, UserApiResponse, DeleteUsersResponse } from '@/types/user';

export const useUserService = {
    async getUsers(params: Record<string, unknown> = {}): Promise<UsersResponse> {
        const response = await apiClient.post<UsersResponse>('/api/admin/users/filter', { params });
        return response.data;
    },

    async storeUser(userData: UserFormData): Promise<UserApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<UserApiResponse>('/api/admin/users', userData);
        return response.data;
    },

    async updateUser(userId: number, updatedData: Partial<UserFormData>): Promise<UserApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<UserApiResponse>(`/api/admin/users/${userId}`, updatedData);
        return response.data;
    },

    async deleteUsers(usersIds: number[]): Promise<DeleteUsersResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteUsersResponse>('/api/admin/users', { data: { users: usersIds } });
        return response.data;
    }
};
