// src/validations/category.ts
import { z } from 'zod';

const requiredStringMax = (max: number) => z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

const optionalString = z.preprocess((v: unknown) => (v === null || v === undefined || v === '' ? null : v), z.string().max(500).nullable());

export const categorySchema = z.object({
    parent_id: z.number().nullable().optional(),
    name: requiredStringMax(150),
    slug: optionalString,
    description: optionalString,
    icon: requiredStringMax(50),
    icon_color: requiredStringMax(20),
    sort_order: z.number().min(0).default(0),
    active: z.boolean().default(true),
    publish: z.boolean().default(false)
});

export type CategorySchemaType = z.infer<typeof categorySchema>;
