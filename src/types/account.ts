// src/types/account.ts

export interface Plan {
    id: number;
    name: string;
    active?: boolean;
    orders?: number | null;
    products?: number | null;
    users?: number | null;
    shops?: number | null;
    price?: number | null;
    created_at?: string;
    updated_at?: string;
}

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

export interface Account {
    id: number;
    legal_name: string;
    trade_name?: string | null;
    rc_number?: string | null;
    nif?: string | null;
    nis?: string | null;
    rib?: string | null;
    plan?: Plan | null;
    active: boolean;
    contacts?: Contact[];
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
    plan?: { id: number; name?: string | null } | null;
    active?: boolean;
    contacts?: Contact[];
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
    plans?: Plan[];
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

export interface ToggleActiveAccountResponse {
    data: Account;
    message?: string;
}
