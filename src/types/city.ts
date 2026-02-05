// src/types/city.ts

import type { Region } from './region';

export interface City {
    id: number;
    name: string;
    name_ar?: string;
    name_fr?: string;
    postal_code: number;
    region?: Region | null;
    region_id?: number | null;
    longitude?: number | null;
    latitude?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface CityFormData {
    id?: number;
    name: string;
    name_ar: string;
    name_fr: string;
    postal_code: number;
    region?: { id: number; name?: string | null } | null;
    region_id?: number | null;
    longitude?: number | null;
    latitude?: number | null;
}

export interface CitiesFilterParams {
    first?: number;
    rows?: number;
    page?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
}

export interface CitiesResponse {
    cities: City[];
    regions?: Region[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
    };
}

export interface CityApiResponse {
    data: City;
    message?: string;
}

export interface DeleteCitiesResponse {
    message: string;
}

export interface ToggleActiveCityResponse {
    data: City;
    message?: string;
}
