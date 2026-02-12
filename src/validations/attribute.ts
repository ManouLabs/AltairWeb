// src/validations/attribute.ts
import { z } from 'zod';

const requiredStringMax = (max: number) => z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

export const ATTRIBUTE_TYPES = ['dropdown', 'text', 'switches', 'multiselect', 'date', 'numeric', 'boolean', 'radio'] as const;

// Schema for PrimeVue Form resolver — only includes fields managed by FormField components
export const attributeSchema = z.object({
    name: requiredStringMax(150),
    active: z.boolean().default(true)
});

// Full schema for API-level validation (type, category_ids, values are managed outside Form)
export const attributeFullSchema = z.object({
    name: requiredStringMax(150),
    type: z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' })),
    active: z.boolean().default(true),
    category_ids: z.array(z.number()).default([]),
    values: z
        .array(
            z.object({
                id: z.number().optional(),
                value: z.string().min(1),
                sort_order: z.number().optional()
            })
        )
        .default([])
});

export type AttributeSchemaType = z.infer<typeof attributeSchema>;
