// src/validations/region.js
import { z } from 'zod';

const toNonNull = (v) => (v === null || v === undefined ? '' : v);

const requiredStringMax = (max) => z.preprocess(toNonNull, z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length', length: max }));

const requiredStringMax50 = requiredStringMax(50);

const optionalNumberBetween = (min, max) => z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number().min(min).max(max).optional());

const requiredCode = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number().int().positive({ message: 'common.messages.is_required' }).max(999));

export const regionSchema = z.object({
    name: requiredStringMax50,
    name_ar: requiredStringMax50,
    name_fr: requiredStringMax50,
    code: requiredCode,
    longitude: optionalNumberBetween(-180, 180),
    latitude: optionalNumberBetween(-90, 90)
});
