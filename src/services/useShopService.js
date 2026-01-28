// src/services/useShopService.js
import apiClient from '@/services/axios';

const buildShopFormData = (shopData, { methodOverride } = {}) => {
    const formData = new FormData();

    if (methodOverride) {
        formData.append('_method', methodOverride);
    }

    for (const [key, value] of Object.entries(shopData || {})) {
        if (value === undefined || value === null) continue;

        if (typeof File !== 'undefined' && value instanceof File) {
            formData.append(key, value);
            continue;
        }

        if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0');
            continue;
        }

        formData.append(key, String(value));
    }

    return formData;
};

const hasFile = (shopData) => {
    return typeof File !== 'undefined' && shopData?.file instanceof File;
};

export const useShopService = {
    async getShops() {
        try {
            const response = await apiClient.get('/api/admin/shops');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeShop(shopData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');

            if (hasFile(shopData)) {
                const formData = buildShopFormData(shopData);
                const response = await apiClient.post('/api/admin/shops', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return response.data;
            }

            const response = await apiClient.post('/api/admin/shops', shopData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateShop(shopId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');

            // Laravel/PHP only reliably parses multipart uploads on POST.
            // For updates with a file, use method spoofing.
            if (hasFile(updatedData)) {
                const formData = buildShopFormData(updatedData, { methodOverride: 'PUT' });
                const response = await apiClient.post(`/api/admin/shops/${shopId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return response.data;
            }

            const response = await apiClient.put(`/api/admin/shops/${shopId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleActiveShop(shopId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/shops/${shopId}/toggle`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteShops(shopsIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/shops', { data: { shops: shopsIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
