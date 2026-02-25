// src/types/supplier.ts

import type { Address, ContactMethod, ContactMethods } from './customer';

export interface SupplierData {
    id: number;
    name: string;
    type: string;
    type_label: string;
    addresses: Address[];
    contactMethods: ContactMethod[];
    logo: { id: number; url: string; original_name: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface SupplierFormData {
    name: string;
    type: string;
    addresses: Address[];
    contactMethods: ContactMethods;
    file?: File | null;
    remove_file?: boolean;
}

export interface SuppliersResponse {
    data: SupplierData[];
    regions?: { id: number; name: string }[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface SupplierApiResponse {
    data: SupplierData;
    message?: string;
}

export interface DeleteSuppliersResponse {
    message: string;
}
