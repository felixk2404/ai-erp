import Link from 'next/link';
import { list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import { INVOICE_STATUSES, type CustomerFields, type InvoiceFields, type ProductFields } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { EmptyState } from '@/components/empty-state';
import { NewInvoiceDialog } from './new-invoice-dialog';
import { toProductOptions } from '@/lib/invoice-items';
import { markPaid } from './actions';
import { ActionButton } from '@/components/forms/action-button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shared } from '@/components/motion/page-transition';

export const dynamic = 'force-dynamic';

type SP = { q?: string; status?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', status = '' } = await searchParams;

  const filters: string[] = [];
  if (status) filters.push(`{Status}='${escapeFormula(status)}'`);
  if (q) {
    const needle = escapeFormula(q.toLowerCase());
    filters.push(`OR(FIND('${needle}', LOWER({InvoiceNumber})), FIND('${needle}', LOWER({CustomerId})))`);
  }

  const [invoices, customers, products] = await Promise.all([
    list<InvoiceFields>('Invoices', {
      filter: filters.length ? `AND(${filters.join(',')})` : undefined,
      sort: [{ field: 'Created', direction: 'desc' }],
    }),
    list<CustomerFields>('Customers', { sort: [{ field: 'Name' }] }),
    list<ProductFields>('Products', { sort: [{ field: 'Name' }] }),
  ]);
  const nameById = new Map(customers.map((c) => [c.fields.CustomerId, c.fields.Name]));

  return (
    <>
      <Header
        title="חשבוניות"
        actions={
          <NewInvoiceDialog
            customers={customers.map((c) => ({ id: c.fields.CustomerId, label: `${c.fields.Name} · ${c.fields.CustomerId}` }))}
            products={toProductOptions(products)}
          />
        }
      />

      <form className="flex flex-wrap items-center gap-2 mb-4" role="search">
        <Input name="q" defaultValue={q} placeholder="חיפוש לפי מספר או לקוח" className="max-w-xs" aria-label="חיפוש" />
        <select
          name="status"
          defaultValue={status}
          aria-label="סטטוס"
          className="h-9 rounded-md border border-input bg-well px-3 text-sm"
        >
          <option value="">כל הסטטוסים</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusMeta('Invoices', s).label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          סינון
        </Button>
        {(q || status) && (
          <Link href="/invoices" className="text-sm text-inkblue">
            נקה
          </Link>
        )}
      </form>

      <div className="panel overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState title="אין חשבוניות" hint={q || status ? 'נסה סינון אחר' : 'צור את החשבונית הראשונה'} />
        ) : (
          <Table label="חשבוניות">
            <TableHeader>
              <TableRow>
                <TableHead>מספר</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead className="hidden md:table-cell">תאריך</TableHead>
                <TableHead className="hidden md:table-cell">לפני מע״מ</TableHead>
                <TableHead className="hidden md:table-cell">מע״מ</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="hidden sm:table-cell">מסמך</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="num font-medium">
                    <Shared name={`invoice-${i.id}`}>
                      <Link href={`/invoices/${i.id}`} transitionTypes={['nav-forward']} className="text-signal hover:underline">
                        {i.fields.InvoiceNumber ?? '—'}
                      </Link>
                    </Shared>
                  </TableCell>
                  <TableCell>
                    {nameById.get(i.fields.CustomerId) ?? i.fields.CustomerId}
                    <div className="text-xs text-ink-3 num">{i.fields.CustomerId}</div>
                  </TableCell>
                  <TableCell className="num text-ink-2 hidden md:table-cell">{dateIL(i.fields.Created)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Money value={i.fields.Amount ?? 0} />
                  </TableCell>
                  <TableCell className="text-ink-2 hidden md:table-cell">
                    <Money value={i.fields.VatAmount ?? 0} />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Money value={i.fields.Total ?? 0} />
                  </TableCell>
                  <TableCell>
                    <StatusLed table="Invoices" status={i.fields.Status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {i.fields.PdfUrl ? (
                      <a href={i.fields.PdfUrl} target="_blank" rel="noreferrer" className="text-inkblue text-sm hover:text-inkblue-hover">
                        PDF
                      </a>
                    ) : (
                      <span className="text-ink-3 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {i.fields.Status === 'generated' && <ActionButton action={markPaid.bind(null, i.id)}>סימון כשולמה</ActionButton>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
