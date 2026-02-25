// src/services/useAccountService.ts
import apiClient from '@/services/axios';
import type { AccountsFilterParams, AccountsResponse, AccountFormData, AccountApiResponse, DeleteAccountsResponse } from '@/types/account';

export const useAccountService = {
    async getAccounts(params: AccountsFilterParams = {}): Promise<AccountsResponse> {
        const response = await apiClient.post<AccountsResponse>('/api/admin/accounts/filter', { params });
        return response.data;
    },

    async getAccount(accountId: number): Promise<AccountApiResponse> {
        const response = await apiClient.get<AccountApiResponse>(`/api/admin/accounts/${accountId}`);
        return response.data;
    },

    async storeAccount(accountData: AccountFormData): Promise<AccountApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<AccountApiResponse>('/api/admin/accounts', accountData);
        return response.data;
    },

    async updateAccount(accountId: number, updatedData: Partial<AccountFormData>): Promise<AccountApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<AccountApiResponse>(`/api/admin/accounts/${accountId}`, updatedData);
        return response.data;
    },

    async deleteAccounts(accountsIds: number[]): Promise<DeleteAccountsResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteAccountsResponse>('/api/admin/accounts', { data: { accounts: accountsIds } });
        return response.data;
    }
};
