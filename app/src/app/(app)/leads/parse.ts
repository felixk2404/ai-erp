import { z } from 'zod';
import { parseForm, optionalText } from '@/lib/parse';

const schema = z.object({
  Name: z.string().trim().min(1, 'יש להזין שם'),
  Email: z.email('אימייל לא תקין').trim(),
  Company: z.unknown().transform(optionalText),
});

export type LeadInput = z.infer<typeof schema>;
export const parseLeadForm = (fd: FormData) => parseForm(schema, fd, ['Name', 'Email', 'Company']);
