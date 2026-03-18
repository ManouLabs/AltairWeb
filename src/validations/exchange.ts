// src/validations/exchange.ts
import { z } from 'zod';

export const requiredString = z.preprocess(
	(v: unknown) => (v === null || v === undefined ? '' : v),
	z.string().min(1, { message: 'common.messages.is_required' })
);

const exchangeItemSchema = z.object({
	order_item_id: z.number().nullable().optional(),
	action: z.string().min(1, { message: 'common.messages.is_required' }),
	reason: z.string().nullable().optional(),
	condition: z.string().nullable().optional(),
	returning_product_id: z.number().nullable().optional(),
	returning_variant_id: z.number().nullable().optional(),
	returning_product_name: z.string().nullable().optional(),
	returning_sku: z.string().nullable().optional(),
	returning_price: z.number().nullable().optional(),
	replacement_product_id: z.number().nullable().optional(),
	replacement_variant_id: z.number().nullable().optional(),
	replacement_product_name: z.string().nullable().optional(),
	replacement_sku: z.string().nullable().optional(),
	replacement_price: z.number().nullable().optional(),
	quantity: z.number().min(1).default(1),
});

export const exchangeSchema = z.object({
	order_id: z.number({ required_error: 'common.messages.is_required' }),
	exchange_shipping_fee: z.number().min(0).default(0),
	note: z.string().optional().default(''),
	items: z.array(exchangeItemSchema).min(1, { message: 'common.messages.is_required' }),
});

export type ExchangeSchemaType = z.infer<typeof exchangeSchema>;
