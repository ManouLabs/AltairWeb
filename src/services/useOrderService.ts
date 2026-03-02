// src/services/useOrderService.ts
import apiClient from '@/services/axios';
import type { DeleteOrdersResponse, OrderApiResponse, OrderFormData, OrdersResponse, ShippingFeeResponse } from '@/types/order';

export const useOrderService = {
    async getOrders(params: Record<string, unknown> = {}): Promise<OrdersResponse> {
        const response = await apiClient.post<OrdersResponse>('/api/admin/orders/filter', { params });
        return response.data;
    },

    async getOrder(orderId: number): Promise<OrderApiResponse> {
        const response = await apiClient.get<OrderApiResponse>(`/api/admin/orders/${orderId}`);
        return response.data;
    },

    async storeOrder(orderData: OrderFormData): Promise<OrderApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.post<OrderApiResponse>('/api/admin/orders', orderData);
        return response.data;
    },

    async updateOrder(orderId: number, updatedData: Partial<OrderFormData>): Promise<OrderApiResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<OrderApiResponse>(`/api/admin/orders/${orderId}`, updatedData);
        return response.data;
    },

    async deleteOrders(orderIds: number[]): Promise<DeleteOrdersResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteOrdersResponse>('/api/admin/orders', { data: { orders: orderIds } });
        return response.data;
    },

    async getShippingFee(shipperId: number, regionId: number, shippingType: string): Promise<ShippingFeeResponse> {
        const response = await apiClient.post<ShippingFeeResponse>('/api/admin/orders/shipping-fee', {
            shipper_id: shipperId,
            region_id: regionId,
            shipping_type: shippingType
        });
        return response.data;
    }
};
