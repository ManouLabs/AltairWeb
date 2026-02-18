// src/validations/subscription.ts
import { z } from 'zod';

const requiredId = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number({ required_error: 'common.messages.is_required' }).int().positive());

// DatePicker gives Date objects; convert to ISO date string for validation
const requiredDate = z.preprocess((v) => (v instanceof Date ? v.toISOString().split('T')[0] : v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const nullableDate = z.preprocess((v) => (v instanceof Date ? v.toISOString().split('T')[0] : v === null || v === undefined || v === '' ? null : v), z.string().nullable().optional());

export const subscriptionSchema = z.object({
    account_id: requiredId,
    plan_id: requiredId,
    starts_at: requiredDate,
    ends_at: nullableDate,
    notes: z.preprocess((v) => (v === null || v === undefined || v === '' ? null : v), z.string().max(1000).nullable().optional())
});

export type SubscriptionFormSchema = z.infer<typeof subscriptionSchema>;
