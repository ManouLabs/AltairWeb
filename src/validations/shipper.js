import { z } from 'zod';

const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const requiredStringMax = (max) => z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length', length: max }));

const optionalStringMax = (max) =>
    z
        .preprocess((v) => (v === null || v === undefined ? undefined : String(v)), z.string().max(max, { message: 'common.messages.max_length', length: max }))
        .optional()
        .nullable();

const regionPricingSchema = z.object({
    region_id: z.number().int().positive(),
    home_delivery_price: z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : Number(v)), z.number().min(0)),
    stop_desk_price: z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : Number(v)), z.number().min(0)),
    return_price: z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : Number(v)), z.number().min(0))
});

export const shipperSchema = z.object({
    name: requiredStringMax(255),
    type: requiredString,
    api: optionalStringMax(500),
    active: z.boolean().optional().default(false),
    region_pricing: z.array(regionPricingSchema).optional()
});
