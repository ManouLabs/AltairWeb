// src/validations/role.ts
import { z } from 'zod';

const toNonNull = (v: unknown): unknown => (v === null || v === undefined ? '' : v);
const preprocess = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(toNonNull, schema);

const requiredStringWithMax = (max: number, maxMsg: string) => preprocess(z.string().min(1, { message: 'common.messages.is_required' }).max(max, { message: maxMsg }));

// Permissions: must select at least one permission
const permissionsArray = z.array(z.union([z.number(), z.string()])).min(1, { message: 'common.messages.is_required' });

export const roleSchema = z.object({
    id: z.union([z.number(), z.string()]).optional(),
    name: requiredStringWithMax(255, 'common.messages.max_length_255'),
    permissions: permissionsArray
});

// Export the inferred type from the schema
export type RoleSchemaType = z.infer<typeof roleSchema>;
