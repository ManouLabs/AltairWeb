// src/types/order.ts

export interface OrderItemData {
    id?: number;
    product_id: number | null;
    product_variant_id: number | null;
    product_name: string;
    variant_label: string | null;
    sku: string | null;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface OrderData {
    id: number;
    account_id: number;
    reference: string;
    subtotal: number;
    shipping_fee: number;
    discount_amount: number;
    discount_percentage: number;
    total: number;
    tracking: string | null;
    shipping_type: string;
    source: string | null;
    status: string;
    payment_status: string;
    note: string | null;
    customer: {
        id: number;
        name: string;
        phone: string | null;
        email: string | null;
        reputation: string | null;
        status: string | null;
        addresses?: any[];
        contactMethods?: any[];
    } | null;
    shop: { id: number; name: string } | null;
    shipper: { id: number; name: string; type: string } | null;
    items: OrderItemData[];
    created_at?: string;
    updated_at?: string;
}

export interface OrderFormData {
    customer_id: number | null;
    shop_id: number | null;
    shipper_id: number | null;
    shipping_fee: number;
    discount_amount: number;
    discount_percentage: number;
    shipping_type: string;
    source: string | null;
    status: string;
    payment_status: string;
    note: string;
    items: OrderItemFormData[];
}

export interface OrderItemFormData {
    id?: number;
    product_id: number | null;
    product_variant_id: number | null;
    product_name: string;
    variant_label: string | null;
    sku: string | null;
    quantity: number;
    unit_price: number;
    stock?: number | null;
}

export interface OrdersResponse {
    data: OrderData[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface OrderApiResponse {
    data: OrderData;
    message?: string;
}

export interface DeleteOrdersResponse {
    message: string;
}

export interface ShippingFeeResponse {
    home_delivery: number;
    stop_desk: number;
    message?: string;
}
