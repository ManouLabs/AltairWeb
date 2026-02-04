// src/validations/shop.ts
import { z } from 'zod';

export const requiredString = z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

export const optionalString = z.string().nullable().optional();

const requiredStringMax = (max: number) => z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

const optionalStringMax = (max: number) =>
    z
        .preprocess((v: unknown) => (v === null || v === undefined ? undefined : String(v)), z.string().max(max, { message: 'common.messages.max_length' }))
        .optional()
        .nullable();

// Helper to extract ID from object or pass through number
const idOrObject = z.preprocess((v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : v), z.number().int().nullable().optional());

const addressSchema = z.object({
    street: optionalStringMax(255),
    region: idOrObject,
    city: idOrObject,
    main: z.boolean().optional()
});

const contactMethodSchema = z.object({
    type: z.string().optional(),
    value: optionalStringMax(255)
});

export const shopSchema = z.object({
    name: requiredStringMax(150),
    description: optionalStringMax(500),
    active: z.boolean().optional().default(true),
    addresses: z.array(addressSchema).optional(),
    contactMethods: z
        .object({
            phone: contactMethodSchema.optional(),
            email: contactMethodSchema.optional(),
            whatsapp: contactMethodSchema.optional(),
            website: contactMethodSchema.optional(),
            linkedin: contactMethodSchema.optional(),
            tiktok: contactMethodSchema.optional()
        })
        .optional(),
    file: z.any().optional().nullable()
});

// Export the inferred type from the schema
export type ShopSchemaType = z.infer<typeof shopSchema>;
