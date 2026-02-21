// src/types/plan.ts

export interface Plan {
    id: number;
    name: string;
    icon?: string | null;
    color?: string | null;
    description?: string | null;
    active: boolean;
    recommended: boolean;
    orders?: number | null;
    products?: number | null;
    users?: number | null;
    shops?: number | null;
    roles?: number | null;
    categories?: number | null;
    shippers?: number | null;
    customers?: number | null;
    contact_methods?: number | null;
    level: number;
    monthly_price?: number | null;
    yearly_price?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface PlanFormData {
    id?: number;
    name: string;
    icon?: string | null;
    color?: string | null;
    description?: string | null;
    active?: boolean;
    recommended?: boolean;
    orders?: number | null;
    products?: number | null;
    users?: number | null;
    shops?: number | null;
    roles?: number | null;
    categories?: number | null;
    shippers?: number | null;
    customers?: number | null;
    contact_methods?: number | null;
    level?: number;
    monthly_price?: number | null;
    yearly_price?: number | null;
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

export interface ToggleRecommendedPlanResponse {
    data: Plan;
    message?: string;
}
