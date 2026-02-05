// src/types/plan.ts

export interface Plan {
    id: number;
    name: string;
    active: boolean;
    orders?: number | null;
    products?: number | null;
    users?: number | null;
    shops?: number | null;
    price?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface PlanFormData {
    id?: number;
    name: string;
    active?: boolean;
    orders?: number | null;
    products?: number | null;
    users?: number | null;
    shops?: number | null;
    price?: number | null;
}

export interface PlansFilterParams {
    first?: number;
    rows?: number;
    page?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
}

export interface PlansResponse {
    data: Plan[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
    };
}

export interface PlanApiResponse {
    data: Plan;
    message?: string;
}

export interface DeletePlansResponse {
    message: string;
}

export interface ToggleActivePlanResponse {
    data: Plan;
    message?: string;
}
