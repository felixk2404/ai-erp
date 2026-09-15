import Link from 'next/link';
import { list } from '@/lib/airtable';
import { searchFormula } from '@/lib/search-formula';
import type { CustomerFields, InvoiceFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { EmptyState } from '@/components/empty-state';
import { EntityDialog } from '@/components/forms/entity-dialog';
import { FieldError } from '@/components/forms/field-error';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createCustomer } from './actions';

export const dynamic = 'force-dynamic';

type SP = { q?: string; has?: string };

/** סינון לפי מצב החשבוניות של הלקוח. מחושב בזיכרון מהרשימות שהעמוד ממילא קורא — בלי קריאה נוספת ל-Airtable. */
const HAS_FILTERS = [
  { key: '', label: 'הכל' },
  { key: 'invoices', label: 'עם חשבוניות' },
  { key: 'none', label: 'בלי חשבוניות' },
  { key: 'open', label: 'חשבונית פתוחה' },
] as const;
type HasFilter = (typeof HAS_FILTERS)[number]['key'];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', has: requested = '' } = await searchParams;
  const has: HasFilter = HAS_FILTERS.some((f) => f.key === requested) ? (requested as HasFilter) : '';

  const [customers, invoices] = await Promise.all([
    list<CustomerFields>('Customers', { filter: searchFormula(['Name', 'Email', 'Phone', 'CustomerId'], q), sort: [{ field: 'CustomerId' }] }),
    list<InvoiceFields>('Invoices', { filter: "{Status}!='error'" }),
  ]);
  const stats = new Map<string, { count: number; total: number; open: number }>();
  for (const i of invoices) {
    const s = stats.get(i.fields.CustomerId) ?? { count: 0, total: 0, open: 0 };
    s.count += 1;
    s.total += i.fields.Total ?? 0;
    if (i.fields.Status !== 'paid') s.open += 1;
    stats.set(i.fields.CustomerId, s);
  }
  const shown = customers.filter((c) => {
    const s = stats.get(c.fields.CustomerId);
    if (has === 'invoices') return !!s;
    if (has === 'none') return !s;
    if (has === 'open') return (s?.open ?? 0) > 0;
    return true;
  });
  const href = (h: string) => `/customers?${new URLSearchParams({ ...(h ? { has: h } : {}), ...(q ? { q } : {}) })}`.replace(/\?$/, '');

  return (
    <>
      <Header
        title="לקוחות"
        actions={
          <EntityDialog
            trigger="לקוח חדש"
            title="לקוח חדש"
            description="המזהה (CUST-000N) נוצר אוטומטית."
            action={createCustomer}
            successMessage="הלקוח נוסף"
            submitLabel="הוספה"
          >
            <>
              <div className="space-y-2">
                <Label htmlFor="c-name">שם</Label>
                <Input id="c-name" name="Name" required autoFocus />
                <FieldError name="Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">אימייל</Label>
                <Input id="c-email" name="Email" type="email" dir="ltr" />
                <FieldError name="Email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">טלפון</Label>
                <Input id="c-phone" name="Phone" type="tel" dir="ltr" inputMode="tel" />
              </div>
            </>
          </EntityDialog>
        }
      />
      <form className="flex flex-wrap items-center gap-2 mb-3" role="search">
        <input type="hidden" name="has" value={has} />
        <Input name="q" defaultValue={q} placeholder="חיפוש לפי שם, אימייל, טלפון או מזהה" className="max-w-xs" aria-label="חיפוש" />
        <Button type="submit" variant="secondary">
          חיפוש
        </Button>
        {q && (
          <Link href={has ? `/customers?has=${has}` : '/customers'} className="text-ink-2 hover:text-ink text-sm">
            נקה
          </Link>
        )}
      </form>

      <nav aria-label="סינון לפי חשבוניות" className="flex flex-wrap gap-1 mb-4">
        {HAS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href(f.key)}
            className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${has === f.key ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-hidden">
        {shown.length === 0 ? (
          <EmptyState title="אין לקוחות" hint={q || has ? 'נסה סינון או חיפוש אחר' : 'הוסף לקוח ראשון כדי להפיק לו חשבוניות'} />
        ) : (
          <Table label="לקוחות">
            <TableHeader>
              <TableRow>
                <TableHead>מזהה</TableHead>
                <TableHead>שם</TableHead>
                <TableHead className="hidden md:table-cell">אימייל</TableHead>
                <TableHead className="hidden sm:table-cell">טלפון</TableHead>
                <TableHead>חשבוניות</TableHead>
                <TableHead>סה״כ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((c) => {
                const s = stats.get(c.fields.CustomerId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="num text-ink-2">{c.fields.CustomerId}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/customers/${c.id}`} transitionTypes={['nav-forward']} className="text-signal hover:underline">
                        {c.fields.Name}
                      </Link>
                    </TableCell>
                    <TableCell dir="ltr" className="text-ink-2 text-end hidden md:table-cell">
                      {c.fields.Email ?? '—'}
                    </TableCell>
                    <TableCell dir="ltr" className="num text-ink-2 text-end hidden sm:table-cell">
                      {c.fields.Phone ?? '—'}
                    </TableCell>
                    <TableCell className="num">{s?.count ?? 0}</TableCell>
                    <TableCell>
                      <Money value={s?.total ?? 0} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
