// src/types/attribute.ts

export interface AttributeValueData {
    id: number;
    value: string;
    sort_order: number;
}

export interface AttributeData {
    id: number;
    account_id: number;
    name: string;
    type: string;
    active: boolean;
    values?: AttributeValueData[];
    categories?: { id: number; name: string }[];
    created_at?: string;
    updated_at?: string;
}

export interface AttributeFormData {
    id?: number;
    name: string | null;
    type: string | null;
    active: boolean;
    category_ids: number[];
    values: { id?: number; value: string; sort_order?: number }[];
}

export interface AttributesResponse {
    attributes: AttributeData[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface AttributeApiResponse {
    data: AttributeData;
    message?: string;
}

export interface DeleteAttributesResponse {
    message: string;
}

export interface ToggleActiveAttributeResponse {
    data: AttributeData;
    message?: string;
}
