// src/validations/order.ts
import { z } from 'zod';

const requiredString = z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

export const orderSchema = z.object({
    customer_id: z.number().nullable().optional(),
    shop_id: z.number().nullable().optional(),
    shipper_id: z.number().nullable().optional(),
    shipping_fee: z.number().min(0).default(0),
    discount_amount: z.number().min(0).default(0),
    discount_percentage: z.number().min(0).max(100).default(0),
    shipping_type: requiredString,
    source: requiredString,
    status: z.string().optional(),
    payment_status: z.string().optional(),
    note: z.string().max(2000).optional().nullable(),
    items: z
        .array(
            z.object({
                product_id: z.number().nullable().optional(),
                product_variant_id: z.number().nullable().optional(),
                product_name: z.string().min(1, { message: 'common.messages.is_required' }),
                variant_label: z.string().nullable().optional(),
                sku: z.string().nullable().optional(),
                quantity: z.number().int().min(1, { message: 'common.messages.min_value' }),
                unit_price: z.number().min(0)
            })
        )
        .min(1, { message: 'order.messages.min_one_item' })
});

export type OrderSchemaType = z.infer<typeof orderSchema>;
