import { z } from 'zod';

export const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));
export const optionalString = z.string().nullable().optional();

const requiredStringMax = (max) => z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length', length: max }));

const optionalStringMax = (max) =>
    z
        .preprocess((v) => (v === null || v === undefined ? undefined : String(v)), z.string().max(max, { message: 'common.messages.max_length', length: max }))
        .optional()
        .nullable();

export const shopSchema = z.object({
    name: requiredStringMax(150),
    description: optionalStringMax(500),
    status: z.enum(['active', 'inactive'], { required_error: 'common.messages.is_required', invalid_type_error: 'common.messages.is_required' })
});
