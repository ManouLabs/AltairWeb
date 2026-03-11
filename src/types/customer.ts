// src/types/customer.ts

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
}

export interface CustomerData {
    id: number;
    name: string;
    status: string;
    status_label: string;
    blocking_reason: string | null;
    addresses: Address[];
    contactMethods: ContactMethod[];
    reputation?: {
        level: string;
        percentage: number | null;
        delivered: number;
        returned: number;
    } | null;
    order_stats?: {
        total_spent: number;
        total_orders: number;
        delivered_orders: number;
        success_rate: number;
        avg_order_value: number;
    } | null;
    recent_orders?: {
        id: number;
        reference: string;
        status: string;
        total: number;
        date: string;
    }[];
    created_at?: string;
    updated_at?: string;
}

export interface CustomerFormData {
    id?: number;
    name: string | null;
    status?: string;
    blocking_reason?: string | null;
    addresses: Address[];
    contactMethods: ContactMethods;
}

export interface CustomersResponse {
    data: CustomerData[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    regions?: Region[];
}

export interface CustomerApiResponse {
    data: CustomerData;
    message?: string;
}

export interface DeleteCustomersResponse {
    message: string;
}

export interface BlockCustomerResponse {
    data: CustomerData;
    message?: string;
}
