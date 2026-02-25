// src/services/useCustomerService.ts
import apiClient from '@/services/axios';
import type { CustomerFormData, CustomersResponse, CustomerApiResponse, DeleteCustomersResponse, BlockCustomerResponse } from '@/types/customer';

export const useCustomerService = {
    async getCustomer(customerId: number): Promise<CustomerApiResponse> {
        const response = await apiClient.get<CustomerApiResponse>(`/api/admin/customers/${customerId}`);
        return response.data;
    },

    async getCustomers(params: Record<string, unknown> = {}): Promise<CustomersResponse> {
        const response = await apiClient.post<CustomersResponse>('/api/admin/customers/filter', { params });
        return response.data;
    },

    async storeCustomer(customerData: CustomerFormData): Promise<CustomerApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<CustomerApiResponse>('/api/admin/customers', customerData);
        return response.data;
    },

    async updateCustomer(customerId: number, updatedData: Partial<CustomerFormData>): Promise<CustomerApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<CustomerApiResponse>(`/api/admin/customers/${customerId}`, updatedData);
        return response.data;
    },

    async blockCustomer(customerId: number, blocked: boolean, blockingReason?: string): Promise<BlockCustomerResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.patch<BlockCustomerResponse>(`/api/admin/customers/${customerId}/block`, {
            blocked,
            blocking_reason: blockingReason || null
        });
        return response.data;
    },

    async deleteCustomers(customerIds: number[]): Promise<DeleteCustomersResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteCustomersResponse>('/api/admin/customers', { data: { customers: customerIds } });
        return response.data;
    }
};
