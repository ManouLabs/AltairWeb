// src/services/EchoService.ts
import apiClient from '@/services/axios';
import Echo from 'laravel-echo';
import type { AxiosResponse } from 'axios';

interface BroadcastAuthResponse {
    auth?: string;
    channel_data?: string;
}

interface Channel {
    name: string;
}

interface Authorizer {
    authorize: (socketId: string, callback: (error: boolean, data: BroadcastAuthResponse | Error) => void) => void;
}

declare global {
    interface Window {
        Echo: Echo<'reverb'>;
    }
}

// Initialize and attach to window for global access
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY as string,
    wsHost: import.meta.env.VITE_REVERB_HOST as string,
    wsPort: import.meta.env.VITE_REVERB_PORT as string,
    wssPort: import.meta.env.VITE_REVERB_SECURE_PORT as string,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: Channel): Authorizer => {
        return {
            authorize: async (socketId: string, callback: (error: boolean, data: BroadcastAuthResponse | Error) => void) => {
                try {
                    const response: AxiosResponse<BroadcastAuthResponse> = await apiClient.post('/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    });

                    callback(false, response.data);
                } catch (error) {
                    callback(true, error as Error);
                }
            }
        };
    }
});

// Export Echo instance for optional direct usage
export default window.Echo;
