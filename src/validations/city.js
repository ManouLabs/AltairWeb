// src/validations/city.js
import { z } from 'zod';

const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const requiredNumber = z.preprocess((v) => (v === null || v === undefined ? undefined : v), z.number().int().positive({ message: 'common.messages.is_required' }));

const postalCode = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const coordinate = z.preprocess((v) => (v === null || v === undefined ? 0 : Number(v)), z.number().optional());

export const citySchema = z.object({
    name: requiredString,
    name_ar: requiredString,
    name_fr: requiredString,
    postal_code: postalCode,
    region_id: requiredNumber,
    longitude: coordinate,
    latitude: coordinate
});
