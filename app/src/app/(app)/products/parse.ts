import { z } from 'zod';
import { parseForm, optionalText } from '@/lib/parse';

const schema = z.object({
  Name: z.string().trim().min(1, 'יש להזין שם מוצר'),
  Sku: z.unknown().transform((v) => optionalText(v)?.toUpperCase()),
  Category: z.string().trim().min(1, 'יש להזין קטגוריה'),
  Price: z.coerce.number({ error: 'יש להזין מחיר' }).min(0, 'המחיר לא יכול להיות שלילי'),
  Description: z.unknown().transform((v) => optionalText(v) ?? ''),
  InStock: z.unknown().transform((v) => v === 'on' || v === 'true'),
});

export type ProductInput = z.infer<typeof schema>;
export const parseProductForm = (fd: FormData) => parseForm(schema, fd, ['Name', 'Sku', 'Category', 'Price', 'Description', 'InStock']);
