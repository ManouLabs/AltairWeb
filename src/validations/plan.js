// src/validations/plan.js
import { z } from 'zod';

const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const optionalUnsignedInt = z.number().int().nonnegative().nullable().optional();

export const planSchema = z.object({
    name: requiredString,
    active: z.boolean().optional().default(true),
    orders: optionalUnsignedInt,
    products: optionalUnsignedInt,
    users: optionalUnsignedInt,
    shops: optionalUnsignedInt,
    price: optionalUnsignedInt
});
