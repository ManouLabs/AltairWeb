// src/types/role.ts

export interface Permission {
    id: number;
    name: string;
    guard_name?: string;
}

export interface RoleData {
    id: number;
    name: string;
    permissions: Permission[];
    guard_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RoleFormData {
    id?: number | string;
    name: string | null;
    permissions: (Permission | number | string)[];
}

export interface RolesResponse {
    roles: RoleData[];
    permissions: Permission[];
    meta: {
        total: number;
        current_page: number;
        per_page: number;
        last_page: number;
    };
}

export interface RoleApiResponse {
    data: RoleData;
    message?: string;
}

export interface DeleteRolesResponse {
    message: string;
}
