// src/validations/user.js
import { z } from 'zod';

export const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(255, { message: 'common.messages.max_length', length: 255 }));

export const requiredEmail = z.preprocess(
    (v) => (v === null || v === undefined ? '' : v),
    z.string().min(1, { message: 'common.messages.is_required' }).max(255, { message: 'common.messages.max_length', length: 255 }).email({ message: 'common.messages.invalid_email' })
);

const passwordStrength = z.preprocess(
    (v) => (v === null || v === undefined ? '' : v),
    z
        .string()
        .min(8, { message: ('common.messages.minimum_length', { length: 8 }) })
        .max(255, { message: ('common.messages.max_length', { length: 255 }) })
        .regex(/[a-z]/, { message: 'common.messages.require_lowercase' })
        .regex(/[A-Z]/, { message: 'common.messages.require_uppercase' })
        .regex(/[0-9]/, { message: 'common.messages.require_numeric' })
        .nonempty({ message: 'common.messages.is_required' })
);

export const userSchema = z
    .object({
        name: requiredString,
        email: requiredEmail,
        password: passwordStrength.optional(),
        password_confirmation: passwordStrength.optional(),
        roles: z.array(z.any()).min(1, { message: 'common.messages.is_required' })
    })
    .refine(
        (data) => {
            if (data.password) {
                return data.password === data.password_confirmation;
            }
            return true;
        },
        { message: 'common.messages.passwords_do_not_match', path: ['password_confirmation'] }
    )
    .refine(
        (data) => {
            if (data.password) {
                return passwordStrength.safeParse(String(data.password)).success;
            }
            return true;
        },
        { message: 'common.messages.password_strength', path: ['password'] }
    );
