import { z } from 'zod';

// Helpers to normalize null/undefined to proper validation expectations
export const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

export const optionalString = z.string().nullable().optional();

export const accountSchema = z.object({
    legal_name: requiredString,
    trade_name: requiredString,
    rc_number: optionalString,
    nif: optionalString,
    nis: optionalString,
    rib: optionalString,
    plan: z.enum(['free', 'paid'], {
        required_error: 'common.messages.is_required',
        invalid_type_error: 'common.messages.is_required'
    }),
    active: z.boolean().optional().default(true),
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
                                        return {
                                            message: 'common.messages.invalid_email',
                                            path: ['value']
                                        };
                                    }
                                    if (type === 'mobile') {
                                        return {
                                            message: 'common.messages.invalid_mobile',
                                            path: ['value']
                                        };
                                    }
                                    if (type === 'url') {
                                        return {
                                            message: 'common.messages.invalid_url',
                                            path: ['value']
                                        };
                                    }
                                    if (type === 'landline') {
                                        return {
                                            message: 'common.messages.invalid_landline',
                                            path: ['value']
                                        };
                                    }
                                    return {
                                        message: 'common.messages.invalid_contact_method',
                                        path: ['value']
                                    };
                                }
                            )
                    )
                    .optional()
                    .default([])
            })
        )
        .optional()
        .default([])
});
