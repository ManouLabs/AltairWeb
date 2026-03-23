// src/services/useNotificationService.ts
import apiClient from '@/services/axios';

export interface NotificationData {
    type: string;
    product_id?: number;
    product_name?: string;
    available_stock?: number;
    threshold?: number;
    message?: string;
    [key: string]: unknown;
}

export interface Notification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

interface UnreadCountResponse {
    count: number;
}

export const useNotificationService = {
    async getNotifications(perPage = 15): Promise<NotificationsResponse> {
        const response = await apiClient.get<NotificationsResponse>('/api/admin/notifications', {
            params: { per_page: perPage },
        });
        return response.data;
    },

    async getUnreadCount(): Promise<UnreadCountResponse> {
        const response = await apiClient.get<UnreadCountResponse>('/api/admin/notifications/unread-count');
        return response.data;
    },

    async markAsRead(id: string): Promise<void> {
        await apiClient.get('/sanctum/csrf-cookie');
        await apiClient.post(`/api/admin/notifications/${id}/read`);
    },

    async markAllAsRead(): Promise<void> {
        await apiClient.get('/sanctum/csrf-cookie');
        await apiClient.post('/api/admin/notifications/read-all');
    },
};
