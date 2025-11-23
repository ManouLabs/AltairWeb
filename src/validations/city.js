// src/validations/city.js
import { z } from 'zod';

const requiredStringMax = (max) => z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: 'common.messages.max_length', length: max }));

const requiredNumber = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number().int().positive({ message: 'common.messages.is_required' }));

const optionalDecimal = z.preprocess((v) => (v === null || v === undefined || v === '' ? undefined : Number(v)), z.number()).optional();

export const citySchema = z.object({
    name: requiredStringMax(50),
    name_ar: requiredStringMax(50),
    name_fr: requiredStringMax(50),
    postal_code: requiredStringMax(20),
    region_id: requiredNumber,
    longitude: optionalDecimal,
    latitude: optionalDecimal
});
