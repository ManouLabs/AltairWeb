// src/validations/validate.ts
import type { ZodSchema, ZodIssue } from 'zod';

interface ValidationSuccess<T> {
    ok: true;
    data: T;
    errors: Record<string, never>;
}

interface ValidationFailure {
    ok: false;
    data?: never;
    errors: Record<string, string[]>;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

interface FieldValidationSuccess {
    ok: true;
    errors: Record<string, never>;
}

interface FieldValidationFailure {
    ok: false;
    errors: Record<string, string[]>;
}

type FieldValidationResult = FieldValidationSuccess | FieldValidationFailure;

export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);
    if (result.success) {
        return { ok: true, data: result.data, errors: {} };
    }

    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
    }
    return { ok: false, errors };
}

export function validateField<T>(schema: ZodSchema<T>, data: unknown, fieldPath: string | (string | number)[]): FieldValidationResult {
    const key = Array.isArray(fieldPath) ? fieldPath.join('.') : String(fieldPath);
    const result = schema.safeParse(data);
    if (result.success) return { ok: true, errors: {} };

    const messages = result.error.issues.filter((i: ZodIssue) => i.path.join('.') === key).map((i: ZodIssue) => i.message);

    if (messages.length === 0) return { ok: true, errors: {} };
    return { ok: false, errors: { [key]: messages } };
}

export type { ValidationResult, FieldValidationResult };
