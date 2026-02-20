// src/validations/plan.ts
import { z } from 'zod';

const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const requiredUnsignedInt = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : v), z.number({ required_error: 'common.messages.is_required', invalid_type_error: 'common.messages.is_required' }).int().nonnegative());

export const planSchema = z.object({
    name: requiredString,
    icon: requiredString,
    color: requiredString,
    description: z.string().max(255).nullable().optional(),
    active: z.boolean().optional().default(true),
    recommended: z.boolean().optional().default(false),
    orders: requiredUnsignedInt,
    products: requiredUnsignedInt,
    users: requiredUnsignedInt,
    shops: requiredUnsignedInt,
    roles: requiredUnsignedInt,
    categories: requiredUnsignedInt,
    shippers: requiredUnsignedInt,
    customers: requiredUnsignedInt,
    contact_methods: requiredUnsignedInt,
    monthly_price: requiredUnsignedInt,
    yearly_price: requiredUnsignedInt,
    level: z.preprocess(
        (v) => (v === null || v === undefined || v === '' ? undefined : v),
        z.number({ required_error: 'common.messages.is_required', invalid_type_error: 'common.messages.is_required' }).int().min(1, { message: 'common.messages.is_required' })
    )
});

export type PlanFormSchema = z.infer<typeof planSchema>;
