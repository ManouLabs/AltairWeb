// src/services/EchoService.js
import apiClient from '@/services/axios';
import Echo from 'laravel-echo';

// Initialize and attach to window for global access
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_SECURE_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => {
        return {
            authorize: async (socketId, callback) => {
                try {
                    const response = await apiClient.post('/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    });

                    callback(false, response.data);
                } catch (error) {
                    callback(true, error);
                }
            }
        };
    }
});

// Export Echo instance for optional direct usage
export default window.Echo;
