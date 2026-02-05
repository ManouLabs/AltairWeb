// src/types/shop.ts

export interface Region {
    id: number;
    name: string;
}

export interface City {
    id: number;
    name: string;
    region_id?: number;
}

export interface Address {
    id?: number;
    street?: string | null;
    region?: Region | number | null;
    city?: City | number | null;
    main?: boolean;
}

export interface ContactMethod {
    id?: number;
    type: string;
    value: string | null;
}

export interface ContactMethods {
    phone?: ContactMethod | null;
    email?: ContactMethod | null;
    whatsapp?: ContactMethod | null;
    website?: ContactMethod | null;
    linkedin?: ContactMethod | null;
    tiktok?: ContactMethod | null;
    facebook?: ContactMethod | null;
    instagram?: ContactMethod | null;
}

export interface ShopFile {
    id: number;
    url: string;
    name?: string;
    mime_type?: string;
}

export interface ShopData {
    id: number;
    name: string;
    description?: string | null;
    active: boolean;
    addresses: Address[];
    contactMethods: ContactMethod[];
    files?: ShopFile[];
    created_at?: string;
    updated_at?: string;
}

export interface ShopFormData {
    id?: number;
    name: string | null;
    description?: string | null;
    active: boolean;
    addresses: Address[];
    contactMethods: ContactMethods;
    files?: File | ShopFile | null;
    file?: File;
    remove_file?: boolean;
}

export interface ShopsResponse {
    data: ShopData[];
    regions?: Region[];
}

export interface ShopApiResponse {
    data: ShopData;
    message?: string;
}

export interface DeleteShopsResponse {
    message: string;
}

export interface ToggleActiveResponse {
    data: ShopData;
    message?: string;
}
