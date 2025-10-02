// src/services/useNotificationService.js
import apiClient from '@/services/axios';

export const useNotificationService = {
    async getNotifications() {
        try {
            const response = await apiClient.get('/api/admin/notifications');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async markAsRead(notificationIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/notifications/read`, { notifications: notificationIds });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteNotifications(notificationIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/notifications', { data: { notifications: notificationIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
