// src/types/account.ts

export interface ContactMethod {
    id?: number | null;
    contact_id?: number | null;
    type: 'email' | 'mobile' | 'landline' | 'url';
    value: string;
}

export interface Contact {
    id?: number | null;
    civility: 'Mr' | 'Mrs' | 'Ms' | 'Dr';
    first_name: string;
    last_name: string;
    contactMethods?: ContactMethod[];
}

export interface Address {
    id?: number | null;
    street: string;
    region?: number | null | Record<string, unknown>;
    city?: number | null | Record<string, unknown>;
    main?: boolean;
}

export interface SubscriptionFormData {
    plan_id: number | null;
    billing_period: 'month' | 'year';
    quantity: number;
    starts_at: string;
}

export interface AccountSubscription extends SubscriptionFormData {
    id?: number;
    ends_at?: string | null;
    active?: boolean;
    notes?: string | null;
    plan?: {
        id: number;
        name: string;
        icon?: string;
        color?: string;
        monthly_price?: number;
        yearly_price?: number;
    };
}

export interface AccountUser {
    id?: number;
    name: string;
    email: string;
    role?: string | null;
    password?: string;
    password_confirmation?: string;
}

export interface Account {
    id: number;
    legal_name: string;
    trade_name?: string | null;
    rc_number?: string | null;
    nif?: string | null;
    nis?: string | null;
    rib?: string | null;
    contacts?: Contact[];
    addresses?: Address[];
    subscription?: AccountSubscription | null;
    users?: AccountUser[];
    created_at?: string;
    updated_at?: string;
}

export interface AccountFormData {
    id?: number;
    legal_name: string;
    trade_name?: string | null;
    rc_number?: string | null;
    nif?: string | null;
    nis?: string | null;
    rib?: string | null;
    active?: boolean;
    contacts?: Contact[];
    addresses?: Address[];
    subscription?: SubscriptionFormData;
    users?: AccountUser[];
}

export interface AccountsFilterParams {
    first?: number;
    rows?: number;
    page?: number;
    sortField?: string;
    sortOrder?: number;
    filters?: Record<string, unknown>;
}

export interface AccountsResponse {
    data: Account[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
    };
}

export interface AccountApiResponse {
    data: Account;
    message?: string;
}

export interface DeleteAccountsResponse {
    message: string;
}
