// src/validations/attribute.ts
import { z } from 'zod';
import { ATTRIBUTE_TYPES } from '@/types/attribute';

const requiredStringMax = (max: number) => z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

export const ATTRIBUTE_TYPE_KEYS = Object.keys(ATTRIBUTE_TYPES) as string[];

export const attributeSchema = z.object({
    name: requiredStringMax(150),
    type: z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' })),
    active: z.boolean().default(true),
    category_ids: z.array(z.number()).min(1, { message: 'common.messages.is_required' }),
    values: z
        .array(
            z.object({
                id: z.number().optional(),
                value: z.string().min(1, { message: 'common.messages.is_required' }),
                color: z.string().max(6).optional().nullable(),
                sort_order: z.number().optional()
            })
        )
        .default([])
});

export type AttributeSchemaType = z.infer<typeof attributeSchema>;
