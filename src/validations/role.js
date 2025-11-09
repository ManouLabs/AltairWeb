// src/validations/role.js
import { z } from 'zod';

const toNonNull = (v) => (v === null || v === undefined ? '' : v);
const preprocess = (schema) => z.preprocess(toNonNull, schema);

const requiredStringWithMax = (max, maxMsg) => preprocess(z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: maxMsg }));

// Permissions: must select at least one permission
const permissionsArray = z.array(z.union([z.number(), z.string()])).min(1, { message: 'common.messages.is_required' });

export const roleSchema = z.object({
    id: z.union([z.number(), z.string()]).optional(),
    name: requiredStringWithMax(255, 'common.messages.max_length_255'),
    guard_name: requiredStringWithMax(50, 'role.messages.guard_name_max'),
    permissions: permissionsArray
});
