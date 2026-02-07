// src/validations/customer.ts
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

// Required ID - must have a value (for region)
const requiredIdOrObject = z.preprocess(
    (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : v),
    z
        .number({
            required_error: 'common.messages.is_required',
            invalid_type_error: 'common.messages.is_required'
        })
        .int()
);

// Address schema with required region
const addressSchema = z.object({
    street: optionalStringMax(255),
    region: requiredIdOrObject,
    city: idOrObject,
    main: z.boolean().optional()
});

// Contact method schema - phone is required, email is optional
const requiredContactMethodSchema = z.object({
    type: z.string().optional(),
    value: z.preprocess((v: unknown) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(255, { message: 'common.messages.max_length' }))
});

const optionalContactMethodSchema = z.object({
    type: z.string().optional(),
    value: optionalStringMax(255)
});

export const customerSchema = z.object({
    name: requiredStringMax(150),
    addresses: z.array(addressSchema).min(1, { message: 'common.messages.is_required' }),
    contactMethods: z.object({
        phone: requiredContactMethodSchema, // Phone is required
        email: optionalContactMethodSchema.optional() // Email is optional
    }),
    blocking_reason: optionalStringMax(500)
});

// Export the inferred type from the schema
export type CustomerSchemaType = z.infer<typeof customerSchema>;
