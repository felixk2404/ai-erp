import { z } from 'zod';

const schema = z.object({
  CustomerId: z.string().trim().min(1, 'יש לבחור לקוח'),
  Amount: z.coerce.number({ error: 'יש להזין סכום' }).positive('הסכום חייב להיות גדול מ-0'),
});

export type InvoiceInput = z.infer<typeof schema>;
export type ParseResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

export function parseInvoiceForm(fd: FormData): ParseResult<InvoiceInput> {
  const r = schema.safeParse({ CustomerId: fd.get('CustomerId') ?? '', Amount: fd.get('Amount') ?? '' });
  if (r.success) return { ok: true, data: r.data };
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message;
  return { ok: false, errors };
}
