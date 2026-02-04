// src/types/shipper.ts

import type { Region } from './shop';

export interface RegionPricing {
    region_id: number;
    home_delivery_price: number;
    stop_desk_price: number;
    return_price: number;
    enabled?: boolean;
}

export interface ShipperData {
    id: number;
    name: string;
    type: 'company' | 'individual';
    active: boolean;
    region_pricing?: RegionPricing[];
    shop_ids?: number[];
    created_at?: string;
    updated_at?: string;
}

export interface ShipperFormData {
    name: string;
    type: 'company' | 'individual';
    api?: string;
    active: boolean;
    region_pricing?: RegionPricing[];
    shop_ids?: number[];
}

export interface ShippersFilterParams {
    search?: string;
    type?: 'company' | 'individual';
    active?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ShippersResponse {
    data: ShipperData[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface ShipperApiResponse {
    data: ShipperData;
    message?: string;
}

export interface DeleteShippersResponse {
    message: string;
}

export interface ToggleActiveShipperResponse {
    data: ShipperData;
    message?: string;
}

// Region type re-export for convenience
export type { Region };
