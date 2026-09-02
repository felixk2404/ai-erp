import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import type { CustomerFields, InvoiceFields, ProductFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { LedgerStrip } from '@/components/ledger-strip';
import { EmptyState } from '@/components/empty-state';
import { DirectionalTransition } from '@/components/motion/page-transition';
import { NewInvoiceDialog } from '../../invoices/new-invoice-dialog';
import { toProductOptions } from '@/lib/invoice-items';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await get<CustomerFields>('Customers', id);
  if (!customer) notFound();
  const c = customer.fields;
  const [invoices, products] = await Promise.all([
    list<InvoiceFields>('Invoices', { filter: `{CustomerId}='${escapeFormula(c.CustomerId)}'`, sort: [{ field: 'Created', direction: 'desc' }] }),
    list<ProductFields>('Products', { sort: [{ field: 'Name' }] }),
  ]);
  const valid = invoices.filter((i) => i.fields.Status !== 'error');
  const total = valid.reduce((s, i) => s + (i.fields.Total ?? 0), 0);
  const open = valid.filter((i) => i.fields.Status !== 'paid').reduce((s, i) => s + (i.fields.Total ?? 0), 0);

  return (
    <DirectionalTransition>
      <nav className="mb-4 text-sm text-ink-3">
        <Link href="/customers" transitionTypes={['nav-back']} className="hover:text-ink">
          ← לקוחות
        </Link>
      </nav>
      <Header title={c.Name} actions={<NewInvoiceDialog customers={[{ id: c.CustomerId, label: `${c.Name} · ${c.CustomerId}` }]} products={toProductOptions(products)} defaultCustomerId={c.CustomerId} />} />
      <div className="text-sm text-ink-2 -mt-3 mb-6 flex flex-wrap gap-x-4 gap-y-1">
        <span className="num" dir="ltr">
          {c.CustomerId}
        </span>
        {c.Email && <span dir="ltr">{c.Email}</span>}
        {c.Phone && (
          <span className="num" dir="ltr">
            {c.Phone}
          </span>
        )}
      </div>

      <LedgerStrip
        items={[
          { label: 'סה״כ חשבוניות', value: <Money value={total} />, hint: `${valid.length} חשבוניות`, hero: true },
          { label: 'פתוח לתשלום', value: <Money value={open} /> },
          { label: 'חשבונית אחרונה', value: invoices[0] ? dateIL(invoices[0].fields.Created) : '—' },
        ]}
      />

      <section className="mt-8">
        <h2 className="text-lg font-bold mb-3">חשבוניות</h2>
        <div className="panel overflow-hidden">
          {invoices.length === 0 ? (
            <EmptyState illustration="invoices" title="אין חשבוניות ללקוח" hint="צרו חשבונית ראשונה מהכפתור למעלה" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סה״כ</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>מסמך</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="num font-medium">
                      <Link href={`/invoices/${i.id}`} transitionTypes={['nav-forward']} className="hover:text-inkblue">
                        {i.fields.InvoiceNumber ?? '—'}
                      </Link>
                    </TableCell>
                    <TableCell className="num text-ink-2">{dateIL(i.fields.Created)}</TableCell>
                    <TableCell>
                      <Money value={i.fields.Total ?? 0} />
                    </TableCell>
                    <TableCell>
                      <StatusLed table="Invoices" status={i.fields.Status} />
                    </TableCell>
                    <TableCell>
                      {i.fields.PdfUrl ? (
                        <a href={i.fields.PdfUrl} target="_blank" rel="noreferrer" className="text-inkblue text-sm">
                          PDF
                        </a>
                      ) : (
                        <span className="text-ink-3 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </DirectionalTransition>
  );
}
