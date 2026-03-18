// src/validations/account.ts
import { z } from 'zod';

// Base helpers used across forms (keep unchanged semantics)
export const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

export const optionalString = z.string().nullable().optional();

// Account-specific helpers matching DB constraints
const requiredStringMax = (max: number) => z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

const optionalStringMax = (max: number) =>
    z
        .preprocess((v) => (v === null || v === undefined ? undefined : String(v)), z.string().max(max, { message: 'common.messages.max_length' }))
        .optional()
        .nullable();

export const accountSchema = z.object({
    legal_name: requiredStringMax(150),
    trade_name: optionalStringMax(150),
    rc_number: z.preprocess(
        (v) => (v === null || v === undefined || v === '' ? undefined : String(v)),
        z
            .string()
            .regex(/^\d{2}-\d{2}-\d{7}[APap]\d{2}$/, { message: 'account.messages.invalid_rc_format' })
            .optional()
            .nullable()
    ),
    nif: z.preprocess(
        (v) => (v === null || v === undefined || v === '' ? undefined : String(v)),
        z
            .string()
            .regex(/^\d{15}$/, { message: 'account.messages.invalid_nif_format' })
            .optional()
            .nullable()
    ),
    nis: z.preprocess(
        (v) => (v === null || v === undefined || v === '' ? undefined : String(v)),
        z
            .string()
            .regex(/^\d{15}$/, { message: 'account.messages.invalid_nis_format' })
            .optional()
            .nullable()
    ),
    rib: optionalStringMax(30),
    addresses: z
        .array(
            z.object({
                street: requiredStringMax(255),
                region: z.number().nullable().optional(),
                city: z.number().nullable().optional(),
                main: z.boolean().optional().default(false)
            })
        )
        .min(1, { message: 'common.messages.is_required' }),
    contacts: z
        .array(
            z.object({
                id: z.number().optional().nullable(),
                civility: z.enum(['Mr', 'Mrs', 'Ms', 'Dr'], {
                    required_error: 'common.messages.is_required',
                    invalid_type_error: 'common.messages.is_required'
                }),
                first_name: requiredString,
                last_name: requiredString,
                contactMethods: z
                    .array(
                        z
                            .object({
                                id: z.number().optional().nullable(),
                                contact_id: z.number().optional().nullable(),
                                type: z.enum(['email', 'mobile', 'landline', 'url']),
                                value: requiredString
                            })
                            .refine(
                                (data) => {
                                    const { type, value } = data;
                                    const v = typeof value === 'string' ? value.trim() : '';
                                    if (!v) return true;
                                    if (type === 'email') {
                                        return z.string().email().safeParse(v).success;
                                    }
                                    if (type === 'mobile') {
                                        return /^0[0-9][0-9]{8}$/.test(v);
                                    }
                                    if (type === 'landline') {
                                        return /^0[0-9][0-9]{7}$/.test(v);
                                    }
                                    if (type === 'url') {
                                        return z.string().url().safeParse(v).success;
                                    }
                                    return true;
                                },
                                (data) => {
                                    const { type } = data;
                                    if (type === 'email') {
                                        return { message: 'common.messages.invalid_email', path: ['value'] };
                                    }
                                    if (type === 'mobile') {
                                        return { message: 'common.messages.invalid_mobile', path: ['value'] };
                                    }
                                    if (type === 'url') {
                                        return { message: 'common.messages.invalid_url', path: ['value'] };
                                    }
                                    if (type === 'landline') {
                                        return { message: 'common.messages.invalid_landline', path: ['value'] };
                                    }
                                    return { message: 'common.messages.invalid_contact_method', path: ['value'] };
                                }
                            )
                    )
                    .optional()
                    .default([])
            })
        )
        .optional()
        .default([]),
    subscription: z
        .object({
            plan_id: z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number({ required_error: 'common.messages.is_required', invalid_type_error: 'common.messages.is_required' })),
            billing_period: z.enum(['month', 'year']).default('month'),
            quantity: z.preprocess((v) => (v === null || v === undefined ? 1 : Number(v)), z.number().min(1, { message: 'common.messages.min_value' })),
            starts_at: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().min(1, { message: 'common.messages.is_required' }))
        })
        .optional(),
    users: z
        .array(
            z
                .object({
                    name: requiredString,
                    email: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).email({ message: 'common.messages.invalid_email' })),
                    role: z.enum(['Admin', 'Staff'], {
                        required_error: 'common.messages.is_required',
                        invalid_type_error: 'common.messages.is_required'
                    }),
                    password: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(8, { message: 'common.messages.min_length' })),
                    password_confirmation: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }))
                })
                .refine((data) => data.password === data.password_confirmation, {
                    message: 'common.messages.password_mismatch',
                    path: ['password_confirmation']
                })
        )
        .optional()
        .default([])
});

export type AccountFormSchema = z.infer<typeof accountSchema>;
