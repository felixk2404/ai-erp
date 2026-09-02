import { z } from 'zod';
import { parseForm, optionalText } from '@/lib/parse';

/** אותו פורמט כמו בקופה של החנות (WF10): 0 + 1–2 ספרות + מקף אופציונלי + 7 ספרות. */
const PHONE = /^0\d{1,2}-?\d{7}$/;

const schema = z.object({
  Name: z.string().trim().min(1, 'יש להזין שם'),
  Email: z.email('אימייל לא תקין').trim(),
  Company: z.unknown().transform(optionalText),
  Phone: z
    .unknown()
    .transform((v) => optionalText(v)?.replace(/\s/g, ''))
    .refine((v) => v === undefined || PHONE.test(v), 'טלפון לא תקין'),
});

export type LeadInput = z.infer<typeof schema>;
export const parseLeadForm = (fd: FormData) => parseForm(schema, fd, ['Name', 'Email', 'Company', 'Phone']);
