// src/types/product.ts

import type { CategoryData } from './category';
import type { AttributeData, AttributeValueData } from './attribute';

export interface ProductVariantData {
    id?: number;
    attribute_values: number[];
    attribute_details?: {
        attribute_id: number;
        attribute_name: string;
        value_id: number;
        value: string;
    }[];
    sku: string | null;
    purchase_price: number;
    sale_price: number;
    stock: number;
}

export interface ProductImageData {
    id: number;
    url: string;
    original_name: string;
}

export interface ProductAttributeData {
    id: number;
    name: string;
    type: string;
    values: AttributeValueData[];
}

export interface ProductData {
    id: number;
    account_id: number;
    name: string;
    sku_prefix: string | null;
    low_stock_threshold: number;
    stock_type: 'single' | 'variant';
    purchase_price: number | null;
    sale_price: number | null;
    total_stock: number;
    active: boolean;
    category: { id: number; name: string; icon?: string; icon_color?: string } | null;
    image: ProductImageData | null;
    attributes: ProductAttributeData[];
    variants: ProductVariantData[];
    selected_value_ids: number[];
    created_at: string;
    updated_at: string;
}

export interface ProductFormData {
    name: string;
    category_id: number | null;
    sku_prefix: string | null;
    low_stock_threshold: number;
    stock_type: 'single' | 'variant';
    purchase_price: number | null;
    sale_price: number | null;
    total_stock: number;
    active: boolean;
    attribute_ids: number[];
    variants: Omit<ProductVariantData, 'attribute_details'>[];
}

export interface ProductsFilterParams {
    global?: { value: string; matchMode: string };
    [key: string]: any;
}

export interface ProductsResponse {
    products: ProductData[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface ProductApiResponse {
    data: ProductData;
}

export interface DeleteProductsResponse {
    status: number;
}

export interface ToggleActiveProductResponse {
    data: ProductData;
}

export interface GenerateVariantsResponse {
    variants: ProductVariantData[];
}
