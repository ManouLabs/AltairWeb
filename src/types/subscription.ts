// src/types/subscription.ts

export interface Subscription {
    id: number;
    account_id: number;
    account_name?: string;
    plan_id: number;
    plan_name?: string;
    active: boolean;
    billing_cycle: 'monthly' | 'yearly';
    starts_at: string;
    ends_at?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface SubscriptionFormData {
    id?: number;
    account_id: number | null;
    plan_id: number | null;
    billing_cycle: 'monthly' | 'yearly';
    starts_at: string;
    notes?: string | null;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string | null;
    monthly_price: number | null;
    yearly_price: number | null;
}

export interface SubscriptionsFilterParams {
    first?: number;
    rows?: number;
    page?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
}

export interface SubscriptionsResponse {
    data: Subscription[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
    };
    accounts: { id: number; legal_name: string; trade_name: string | null }[];
    plans: SubscriptionPlan[];
}

export interface SubscriptionApiResponse {
    data: Subscription;
    message?: string;
}

export interface DeleteSubscriptionsResponse {
    message: string;
}

export interface ToggleActiveSubscriptionResponse {
    data: Subscription;
}
