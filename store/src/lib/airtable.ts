import 'server-only';
import { env } from './env';
import type { Rec, TableName } from './types';

export type Sort = { field: string; direction?: 'asc' | 'desc' };
export type ListOpts = { filter?: string; sort?: Sort[]; max?: number };

const headers = () => ({ Authorization: `Bearer ${env().AIRTABLE_PAT}` });
const base = () => `https://api.airtable.com/v0/${env().AIRTABLE_BASE_ID}`;

/** תקציב לקריאה שלמה (כולל דפדוף). בלי זה fetch של Node מחכה ~5 דקות ל-API תקוע. */
const TIMEOUT_MS = 8_000;

/** קורא רשומות מטבלה, עוקב אחרי offset (pagination) עד max או עד הסוף. תמיד no-store. */
export async function list<F>(table: TableName, opts: ListOpts = {}): Promise<Rec<F>[]> {
  const out: Rec<F>[] = [];
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let offset: string | undefined;
  do {
    const url = new URL(`${base()}/${encodeURIComponent(table)}`);
    if (opts.filter) url.searchParams.set('filterByFormula', opts.filter);
    opts.sort?.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction ?? 'asc');
    });
    if (opts.max) url.searchParams.set('maxRecords', String(opts.max));
    if (offset) url.searchParams.set('offset', offset);
    const res = await fetch(url, { headers: headers(), cache: 'no-store', signal });
    if (!res.ok) {
      // הגוף של איירטייבל נשאר בלוג של השרת בלבד: הוא עלול להכיל שמות שדות ומזהי בסיס
      console.error(`[store] airtable ${table}`, `${res.status} ${(await res.text()).slice(0, 500)}`);
      throw new Error(`Airtable ${res.status} on ${table}`);
    }
    const data = (await res.json()) as { records: Rec<F>[]; offset?: string };
    out.push(...data.records);
    offset = data.offset;
  } while (offset && (!opts.max || out.length < opts.max));
  return opts.max ? out.slice(0, opts.max) : out;
}
