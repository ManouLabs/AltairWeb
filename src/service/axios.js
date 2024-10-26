// axios.js
import { useLoading } from '@/stores/useLoadingStore';
import axios from 'axios';
// Create an axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    withXSRFToken: true // Ensure credentials (cookies) are sent with each request
});

// Axios request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const loadingStore = useLoading();
        loadingStore.startLoading(); // Start the loading progress before the request is sent
        return config;
    },
    (error) => {
        const loadingStore = useLoading();
        loadingStore.stopLoading(); // Stop loading in case of error
        return Promise.reject(error);
    }
);

// Axios response interceptor
apiClient.interceptors.response.use(
    (response) => {
        const loadingStore = useLoading();
        loadingStore.stopLoading(); // Stop the loading progress when a response is received
        return response;
    },
    (error) => {
        const loadingStore = useLoading();
        loadingStore.stopLoading(); // Stop loading in case of error
        return Promise.reject(error);
    }
);
export default apiClient;
