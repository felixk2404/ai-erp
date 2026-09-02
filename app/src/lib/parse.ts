import type { ZodType } from 'zod';

export type ParseResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

/** מריץ סכימת zod על שדות FormData ומחזיר שגיאות לפי שם שדה (ההודעה הראשונה לכל שדה). */
export function parseForm<T>(schema: ZodType<T>, fd: FormData, keys: string[]): ParseResult<T> {
  const raw: Record<string, unknown> = {};
  for (const k of keys) raw[k] = fd.get(k) ?? '';
  const r = schema.safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message;
  return { ok: false, errors };
}

/** "" → undefined, אחרת trim. לשדות אופציונליים. */
export const optionalText = (v: unknown) => {
  const s = String(v ?? '').trim();
  return s ? s : undefined;
};
