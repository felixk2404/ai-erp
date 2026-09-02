import 'server-only';
import { z } from 'zod';

const schema = z.object({
  AIRTABLE_PAT: z.string().min(1),
  AIRTABLE_BASE_ID: z.string().regex(/^app[A-Za-z0-9]{14}$/),
  N8N_WEBHOOK_URL: z.url().transform((u) => u.replace(/\/+$/, '')),
  N8N_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type Env = z.infer<typeof schema>;

export function readEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Missing/invalid env: ${missing}`);
  }
  return parsed.data;
}

let cached: Env | undefined;

/** עצל בכוונה: נקרא רק בתוך request handler, כדי ש-build/lint/test ירוצו בלי משתני סביבה. */
export function env(): Env {
  return (cached ??= readEnv());
}
