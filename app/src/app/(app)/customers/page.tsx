import Link from 'next/link';
import { list } from '@/lib/airtable';
import type { CustomerFields, InvoiceFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { EmptyState } from '@/components/empty-state';
import { EntityDialog } from '@/components/forms/entity-dialog';
import { FieldError } from '@/components/forms/field-error';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCustomer } from './actions';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const [customers, invoices] = await Promise.all([
    list<CustomerFields>('Customers', { sort: [{ field: 'CustomerId' }] }),
    list<InvoiceFields>('Invoices', { filter: "{Status}!='error'" }),
  ]);
  const stats = new Map<string, { count: number; total: number }>();
  for (const i of invoices) {
    const s = stats.get(i.fields.CustomerId) ?? { count: 0, total: 0 };
    s.count += 1;
    s.total += i.fields.Total ?? 0;
    stats.set(i.fields.CustomerId, s);
  }

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
      <div className="panel overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState title="אין לקוחות" hint="הוסף לקוח ראשון כדי להפיק לו חשבוניות" />
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
              {customers.map((c) => {
                const s = stats.get(c.fields.CustomerId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="num text-ink-2">{c.fields.CustomerId}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/customers/${c.id}`} transitionTypes={['nav-forward']} className="hover:text-inkblue">
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
