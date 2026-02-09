// src/types/category.ts

export interface CategoryData {
    id: number;
    account_id: number;
    parent_id: number | null;
    name: string;
    slug: string | null;
    description: string | null;
    icon: string | null;
    icon_color: string | null;
    sort_order: number;
    active: boolean;
    publish: boolean;
    created_at?: string;
    updated_at?: string;
    parent?: {
        id: number;
        name: string;
    } | null;
    children?: CategoryData[];
}

export interface CategoryFormData {
    id?: number;
    parent_id: number | null;
    name: string | null;
    slug: string | null;
    description: string | null;
    icon: string | null;
    icon_color: string | null;
    sort_order: number;
    active: boolean;
    publish: boolean;
}

export interface CategoriesResponse {
    categories: CategoryData[];
    allCategories: { id: number; name: string }[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface CategoryApiResponse {
    data: CategoryData;
    message?: string;
}

export interface DeleteCategoriesResponse {
    message: string;
}
