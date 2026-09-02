import { z } from 'zod';
import { parseForm, optionalText } from '@/lib/parse';

const schema = z.object({
  Name: z.string().trim().min(1, 'יש להזין שם'),
  Email: z
    .string()
    .trim()
    .transform((v) => v || undefined)
    .pipe(z.email('אימייל לא תקין').optional()),
  Phone: z.unknown().transform(optionalText),
});

export type CustomerInput = z.infer<typeof schema>;
export const parseCustomerForm = (fd: FormData) => parseForm(schema, fd, ['Name', 'Email', 'Phone']);

/** CUST-0001 … — ממשיך מהמספר הגבוה ביותר שקיים. */
export function nextCustomerId(existing: string[]): string {
  const max = existing.reduce((m, id) => {
    const n = /^CUST-(\d+)$/.exec(id ?? '');
    return n ? Math.max(m, Number(n[1])) : m;
  }, 0);
  return `CUST-${String(max + 1).padStart(4, '0')}`;
}
