// src/validations/order.ts
import { z } from 'zod';

const requiredString = z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const requiredId = z.preprocess((v: unknown) => (v === null || v === undefined ? undefined : v), z.number({ required_error: 'common.messages.is_required' }).min(1, { message: 'common.messages.is_required' }));

const coerceNumber = (v: unknown) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
};

export const orderSchema = z.object({
    customer_id: requiredId,
    shop_id: requiredId,
    shipper_id: requiredId,
    shipping_fee: z.preprocess(coerceNumber, z.number().min(0).default(0)),
    discount_amount: z.preprocess(coerceNumber, z.number().min(0).default(0)),
    discount_percentage: z.preprocess(coerceNumber, z.number().min(0).max(100).default(0)),
    shipping_type: requiredString,
    source: requiredString,
    status: z.string().optional(),
    payment_status: requiredString,
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
