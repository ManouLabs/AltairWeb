// src/validations/region.js
import { z } from 'zod';

const requiredString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().min(1, { message: 'common.messages.is_required' }));

const optionalString = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string().optional());

const coordinate = z.preprocess((v) => (v === null || v === undefined ? 0 : Number(v)), z.number().optional());

export const regionSchema = z.object({
    name: requiredString,
    name_ar: requiredString,
    name_fr: requiredString,
    longitude: coordinate,
    latitude: coordinate
});
