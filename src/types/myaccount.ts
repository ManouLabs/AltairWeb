// src/types/myaccount.ts

export interface Activity {
    id: number;
    log_name: string;
    description: string;
    event: 'created' | 'updated' | 'deleted';
    subject_type?: string;
    subject_id?: number;
    causer_type?: string;
    causer_id?: number;
    properties?: {
        attributes?: Record<string, any>;
        old?: Record<string, any>;
    };
    created_at: string;
    updated_at?: string;
    // UI enriched fields
    icon?: string;
    color?: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ActivitiesResponse {
    activities: Activity[];
    meta?: PaginationMeta;
}

// Update My Information
export interface UpdateMyInformationData {
    name: string;
    email: string;
}

export interface UpdateMyInformationResponse {
    user: {
        id: number;
        name: string;
        email: string;
    };
    message?: string;
}

// Update Password
export interface UpdatePasswordData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export interface UpdatePasswordResponse {
    message: string;
}

// Delete Account
export interface DeleteAccountData {
    email: string;
    confirmation_phrase: string;
}

export interface DeleteAccountResponse {
    message: string;
}

// Upload Profile Picture
export interface UploadProfilePictureResponse {
    profile_image: string;
    message?: string;
}
