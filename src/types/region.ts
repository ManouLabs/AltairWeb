// src/types/region.ts

export interface Region {
    id: number;
    name: string;
    name_ar?: string;
    name_fr?: string;
    code: number;
    longitude?: number | null;
    latitude?: number | null;
    active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface RegionFormData {
    id?: number;
    name: string;
    name_ar: string;
    name_fr: string;
    code: number;
    longitude?: number | null;
    latitude?: number | null;
}

export interface City {
    id: number;
    name: string;
    region_id?: number;
}

export interface RegionsFilterParams {
    first?: number;
    rows?: number;
    page?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
}

export interface RegionsResponse {
    data: Region[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
    };
}

export interface AllRegionsResponse {
    regions: Region[];
}

export interface RegionCitiesResponse {
    cities: City[];
}

export interface RegionApiResponse {
    data: Region;
    message?: string;
}

export interface DeleteRegionsResponse {
    message: string;
}

export interface ToggleActiveRegionResponse {
    data: Region;
    message?: string;
}
