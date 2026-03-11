// src/types/attribute.ts

export type AttributeType = 'dropdown' | 'text' | 'color' | 'multiselect' | 'date' | 'numeric' | 'boolean' | 'radio';

export const ATTRIBUTE_TYPES: Record<AttributeType, { icon: string; label: string; color: string }> = {
    dropdown: { icon: 'pi pi-chevron-down', label: 'attribute.types.dropdown', color: '#3B82F6' },
    text: { icon: 'pi pi-align-left', label: 'attribute.types.text', color: '#64748B' },
    color: { icon: 'pi pi-palette', label: 'attribute.types.color', color: '#10B981' },
    multiselect: { icon: 'pi pi-check-square', label: 'attribute.types.multiselect', color: '#8B5CF6' },
    date: { icon: 'pi pi-calendar', label: 'attribute.types.date', color: '#F59E0B' },
    numeric: { icon: 'pi pi-hashtag', label: 'attribute.types.numeric', color: '#06B6D4' },
    boolean: { icon: 'pi pi-check-square', label: 'attribute.types.boolean', color: '#10B981' },
    radio: { icon: 'pi pi-circle-fill', label: 'attribute.types.radio', color: '#EC4899' }
};
export interface AttributeValueData {
    id: number;
    value: string;
    color?: string;
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
    values: { id?: number; value: string; color?: string; sort_order?: number }[];
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
