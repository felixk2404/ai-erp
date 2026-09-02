import 'server-only';
import { z } from 'zod';

const schema = z.object({
  AIRTABLE_PAT: z.string().min(1),
  AIRTABLE_BASE_ID: z.string().regex(/^app[A-Za-z0-9]{14}$/),
  N8N_WEBHOOK_URL: z.url().transform((u) => u.replace(/\/+$/, '')),
  N8N_WEBHOOK_SECRET: z.string().min(1),
  APP_PASSWORD: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
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
export function env(): Env {
  return (cached ??= readEnv());
}
