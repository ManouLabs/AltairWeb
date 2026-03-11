// src/types/supplier.ts

import type { Address, ContactMethod, ContactMethods } from './customer';

export type SupplierType = 'manufacturer' | 'wholesaler' | 'distributor' | 'importer' | 'service_provider' | 'agent_broker' | 'other';

export const SUPPLIER_TYPES: Record<SupplierType, { icon: string; color: string }> = {
    manufacturer: { icon: 'pi pi-wrench', color: 'text-blue-500' },
    wholesaler: { icon: 'pi pi-warehouse', color: 'text-amber-500' },
    distributor: { icon: 'pi pi-truck', color: 'text-indigo-500' },
    importer: { icon: 'pi pi-globe', color: 'text-teal-500' },
    service_provider: { icon: 'pi pi-briefcase', color: 'text-cyan-500' },
    agent_broker: { icon: 'pi pi-users', color: 'text-purple-500' },
    other: { icon: 'pi pi-ellipsis-h', color: 'text-gray-500' }
};

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
