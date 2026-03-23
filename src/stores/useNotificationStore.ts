// src/stores/useNotificationStore.ts
import { useNotificationService } from '@/services/useNotificationService';
import type { Notification } from '@/services/useNotificationService';
import { useAuthStore } from '@/stores/useAuthStore';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface DataStreamEvent {
    data: Record<string, unknown>;
    action: string;
}

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref<Notification[]>([]);
    const unreadCount = ref(0);
    const loading = ref(false);

    const hasUnread = computed(() => unreadCount.value > 0);

    async function fetchNotifications() {
        loading.value = true;
        try {
            const data = await useNotificationService.getNotifications(20);
            notifications.value = data.notifications;
        } finally {
            loading.value = false;
        }
    }

    async function fetchUnreadCount() {
        try {
            const data = await useNotificationService.getUnreadCount();
            unreadCount.value = data.count;
        } catch {
            // Silently ignore — bell badge is non-critical
        }
    }

    async function markAsRead(id: string) {
        await useNotificationService.markAsRead(id);
        const notification = notifications.value.find((n) => n.id === id);
        if (notification) {
            notification.read_at = new Date().toISOString();
        }
        unreadCount.value = Math.max(0, unreadCount.value - 1);
    }

    async function markAllAsRead() {
        await useNotificationService.markAllAsRead();
        notifications.value.forEach((n) => (n.read_at = n.read_at || new Date().toISOString()));
        unreadCount.value = 0;
    }

    /**
     * Listen for real-time notifications via the tenant-scoped DataStream channel.
     * Follows the same pattern as all other entities in the app.
     */
    function startListening() {
        const authStore = useAuthStore();
        const accountId = authStore.user?.account_id;
        if (!accountId) return;

        window.Echo.private(`data-stream.notification${accountId}`).listen('DataStream', (event: DataStreamEvent) => {
            if (event.action === 'store') {
                // Push the notification data to the top of the list
                const newNotification: Notification = {
                    id: `temp-${Date.now()}`,
                    type: 'App\\Notifications\\LowStockNotification',
                    notifiable_type: 'App\\Models\\Admin\\User',
                    notifiable_id: authStore.user?.id || 0,
                    data: event.data as Notification['data'],
                    read_at: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                notifications.value.unshift(newNotification);
                unreadCount.value++;
            }
        });
    }

    function stopListening() {
        const authStore = useAuthStore();
        const accountId = authStore.user?.account_id;
        if (!accountId) return;

        window.Echo.leave(`data-stream.notification${accountId}`);
    }

    return {
        notifications,
        unreadCount,
        loading,
        hasUnread,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        startListening,
        stopListening,
    };
});
