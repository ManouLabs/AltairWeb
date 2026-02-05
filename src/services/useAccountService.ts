// src/services/useAccountService.ts
import apiClient from '@/services/axios';
import type { AccountsFilterParams, AccountsResponse, AccountFormData, AccountApiResponse, ToggleActiveAccountResponse, DeleteAccountsResponse } from '@/types/account';

export const useAccountService = {
    async getAccounts(params: AccountsFilterParams = {}): Promise<AccountsResponse> {
        try {
            const response = await apiClient.post<AccountsResponse>('/api/admin/accounts/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeAccount(accountData: AccountFormData): Promise<AccountApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<AccountApiResponse>('/api/admin/accounts', accountData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateAccount(accountId: number, updatedData: Partial<AccountFormData>): Promise<AccountApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<AccountApiResponse>(`/api/admin/accounts/${accountId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveAccount(accountId: number): Promise<ToggleActiveAccountResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<ToggleActiveAccountResponse>(`/api/admin/accounts/${accountId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteAccounts(accountsIds: number[]): Promise<DeleteAccountsResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteAccountsResponse>('/api/admin/accounts', { data: { accounts: accountsIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
