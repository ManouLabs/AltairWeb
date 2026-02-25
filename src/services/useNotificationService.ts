// src/services/useNotificationService.ts
import apiClient from '@/services/axios';

export interface Notification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

interface NotificationsResponse {
    notifications: Notification[];
}

interface MarkAsReadResponse {
    message: string;
}

interface DeleteNotificationsResponse {
    message: string;
}

export const useNotificationService = {
    async getNotifications(): Promise<NotificationsResponse> {
        const response = await apiClient.get<NotificationsResponse>('/api/admin/notifications');
        return response.data;
    },

    async markAsRead(notificationIds: string[]): Promise<MarkAsReadResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.put<MarkAsReadResponse>(`/api/admin/notifications/read`, { notifications: notificationIds });
        return response.data;
    },

    async deleteNotifications(notificationIds: string[]): Promise<DeleteNotificationsResponse> {
        await apiClient.get('/sanctum/csrf-cookie');
        const response = await apiClient.delete<DeleteNotificationsResponse>('/api/admin/notifications', { data: { notifications: notificationIds } });
        return response.data;
    }
};
