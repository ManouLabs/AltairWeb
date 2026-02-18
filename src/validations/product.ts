// src/validations/product.ts
import { z } from 'zod';

const requiredStringMax = (max: number) => z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

// Schema for PrimeVue Form resolver — only includes fields managed by FormField components
export const productSchema = z.object({
    name: requiredStringMax(200),
    sku_prefix: z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().max(50).optional()),
    low_stock_threshold: z.preprocess((v: unknown) => (v === null || v === undefined ? 10 : Number(v)), z.number().min(0).default(10)),
    active: z.boolean().default(false)
});

// Full schema for API-level validation
export const productFullSchema = z.object({
    name: requiredStringMax(200),
    category_id: z.number().nullable().optional(),
    sku_prefix: z.string().max(50).nullable().optional(),
    low_stock_threshold: z.number().min(0).default(10),
    stock_type: z.enum(['single', 'variant']).default('single'),
    purchase_price: z.number().min(0, { message: 'common.messages.is_required' }),
    sale_price: z.number().min(0, { message: 'common.messages.is_required' }),
    total_stock: z.number().min(0, { message: 'common.messages.is_required' }).default(0),
    active: z.boolean().default(false),
    attribute_ids: z.array(z.number()).default([]),
    variants: z
        .array(
            z.object({
                id: z.number().optional(),
                attribute_values: z.array(z.number()),
                sku: z.string().max(100).nullable().optional(),
                purchase_price: z.number().min(0).default(0),
                sale_price: z.number().min(0).default(0),
                stock: z.number().min(0).default(0)
            })
        )
        .default([])
});

export type ProductSchemaType = z.infer<typeof productSchema>;
