// src/types/exchange.ts

export interface ExchangeItemData {
	id?: number;
	order_item_id: number | null;
	action: string;
	reason: string | null;
	condition: string | null;
	returning_product_id: number | null;
	returning_variant_id: number | null;
	returning_product_name: string | null;
	returning_sku: string | null;
	returning_price: number | null;
	replacement_product_id: number | null;
	replacement_variant_id: number | null;
	replacement_product_name: string | null;
	replacement_sku: string | null;
	replacement_price: number | null;
	replacement_quantity: number;
	quantity: number;
}

export interface ExchangeData {
	id: number;
	account_id: number;
	order_id: number;
	reference: string;
	status: string;
	subtotal_adjustment: number;
	exchange_shipping_fee: number;
	cod_balance_due: number;
	note: string | null;
	processed_at: string | null;
	processed_by_user: { id: number; name: string } | null;
	order: {
		id: number;
		reference: string;
		total: number;
		status: string;
		customer: {
			id: number;
			name: string;
			phone: string | null;
			email: string | null;
			status: string | null;
		} | null;
	} | null;
	items: ExchangeItemData[];
	created_at?: string;
	updated_at?: string;
}

export interface ExchangeFormData {
	order_id: number | null;
	exchange_shipping_fee: number;
	note: string;
	items: ExchangeItemFormData[];
}

export interface ExchangeItemFormData {
	id?: number;
	order_item_id: number | null;
	is_new?: boolean;
	action: string | null;
	reason: string | null;
	condition: string | null;
	returning_product_id: number | null;
	returning_variant_id: number | null;
	returning_product_name: string | null;
	returning_sku: string | null;
	returning_price: number | null;
	replacement_product_id: number | null;
	replacement_variant_id: number | null;
	replacement_product_name: string | null;
	replacement_sku: string | null;
	replacement_price: number | null;
	replacement_quantity: number;
	replacement_stock: number | null;
	quantity: number;
}

export interface ExchangesResponse {
	data: ExchangeData[];
	meta?: {
		total: number;
		per_page: number;
		current_page: number;
		last_page: number;
	};
}

export interface ExchangeApiResponse {
	data: ExchangeData;
	message?: string;
}

export interface DeleteExchangesResponse {
	message: string;
}
