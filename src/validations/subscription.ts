// src/validations/subscription.ts
import { z } from 'zod';

const requiredId = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number({ required_error: 'common.messages.is_required' }).int().positive());

// DatePicker gives Date objects; convert to ISO date string for validation
const requiredDate = z.preprocess((v) => (v instanceof Date ? v.toISOString().split('T')[0] : v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

// Assuming requiredUnsignedInt is defined elsewhere or will be defined.
// For the purpose of this instruction, we are only adding the line as requested.
const requiredUnsignedInt = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number({ required_error: 'common.messages.is_required' }).int().nonnegative());

export const subscriptionSchema = z.object({
    account_id: requiredId,
    plan_id: requiredId,
    billing_cycle: z.enum(['monthly', 'yearly'], { required_error: 'common.messages.is_required' }),
    quantity: requiredUnsignedInt,
    starts_at: requiredDate,
    notes: z.preprocess((v) => (v === null || v === undefined || v === '' ? null : v), z.string().max(1000).nullable().optional())
});

export type SubscriptionFormSchema = z.infer<typeof subscriptionSchema>;
