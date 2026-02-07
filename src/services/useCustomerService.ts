// src/services/useCustomerService.ts
import apiClient from '@/services/axios';
import type { CustomerFormData, CustomersResponse, CustomerApiResponse, DeleteCustomersResponse, BlockCustomerResponse } from '@/types/customer';

interface FilterParams {
    [key: string]: unknown;
}

export const useCustomerService = {
    async getCustomers(params: FilterParams = {}): Promise<CustomersResponse> {
        try {
            const response = await apiClient.post<CustomersResponse>('/api/admin/customers/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeCustomer(customerData: CustomerFormData): Promise<CustomerApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post<CustomerApiResponse>('/api/admin/customers', customerData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCustomer(customerId: number, updatedData: Partial<CustomerFormData>): Promise<CustomerApiResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put<CustomerApiResponse>(`/api/admin/customers/${customerId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async blockCustomer(customerId: number, blocked: boolean, blockingReason?: string): Promise<BlockCustomerResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch<BlockCustomerResponse>(`/api/admin/customers/${customerId}/block`, {
                blocked,
                blocking_reason: blockingReason || null
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteCustomers(customerIds: number[]): Promise<DeleteCustomersResponse> {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete<DeleteCustomersResponse>('/api/admin/customers', { data: { customers: customerIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
