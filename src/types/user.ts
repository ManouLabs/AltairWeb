// src/types/user.ts

export interface Role {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    password?: string;
    password_confirmation?: string;
    roles: Role[];
    created_at?: string;
    updated_at?: string;
    account_id?: number;
}

export interface UserFormData {
    name: string | null;
    email: string | null;
    password: string | null;
    password_confirmation: string | null;
    roles: (Role | number)[];
}

export interface UsersResponse {
    users: User[];
    roles: Role[];
    meta: {
        total: number;
        current_page: number;
        per_page: number;
        last_page: number;
    };
}

export interface UserApiResponse {
    data: User;
    message?: string;
}

export interface DeleteUsersResponse {
    message: string;
}
