// src/validations/city.ts
import { z } from 'zod';

export const optionalString = z.string().nullable().optional();

const requiredStringMax = (max: number) => z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length' }));

const requiredPostalCode = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number().int().positive({ message: 'common.messages.is_required' }));

const optionalNumberBetween = (min: number, max: number) => z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number().min(min).max(max).optional());

export const citySchema = z.object({
    name: requiredStringMax(50),
    name_ar: requiredStringMax(50),
    name_fr: requiredStringMax(50),
    postal_code: requiredPostalCode,
    region: z
        .object({
            id: z.coerce.number({ invalid_type_error: 'common.messages.is_required', required_error: 'common.messages.is_required' }).int({ message: 'common.messages.is_required' }).positive({ message: 'common.messages.is_required' }),
            name: optionalString
        })
        .nullable()
        .optional(),
    longitude: optionalNumberBetween(-180, 180),
    latitude: optionalNumberBetween(-90, 90)
});

export type CityFormSchema = z.infer<typeof citySchema>;
