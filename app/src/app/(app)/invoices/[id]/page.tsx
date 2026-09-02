import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import type { CustomerFields, InvoiceFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { Timeline, type TimelineStep } from '@/components/timeline';
import { DirectionalTransition, Shared } from '@/components/motion/page-transition';
import { Button } from '@/components/ui/button';
import { markPaid } from '../actions';
import { parseItems, lineTotal } from '@/lib/invoice-items';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tilt } from '@/components/motion/tilt';

export const dynamic = 'force-dynamic';

const ORDER = ['new', 'validated', 'generated', 'paid'] as const;
const LABEL: Record<(typeof ORDER)[number], string> = { new: 'נוצרה', validated: 'אומתה + מע״מ', generated: 'הופק PDF', paid: 'שולם' };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await get<InvoiceFields>('Invoices', id);
  if (!invoice) notFound();
  const f = invoice.fields;
  const [customer] = await list<CustomerFields>('Customers', { filter: `{CustomerId}='${escapeFormula(f.CustomerId)}'`, max: 1 });

  const status = f.Status ?? 'new';
  const idx = status === 'error' ? -1 : ORDER.indexOf(status as (typeof ORDER)[number]);
  const steps: TimelineStep[] = ORDER.map((s, i) => ({
    label: LABEL[s],
    hint: i === 0 ? dateIL(f.Created) : undefined,
    state: status === 'error' ? (i === 0 ? 'error' : 'todo') : i < idx ? 'done' : i === idx ? (s === 'paid' ? 'done' : 'current') : 'todo',
  }));
  const items = parseItems(f.Items);
  const driveId = f.PdfUrl ? /\/d\/([^/]+)/.exec(f.PdfUrl)?.[1] : undefined;

  return (
    <DirectionalTransition>
      <nav className="mb-4 text-sm text-ink-3">
        <Link href="/invoices" transitionTypes={['nav-back']} className="hover:text-ink">
          ← חשבוניות
        </Link>
      </nav>
      <Header
        title={f.InvoiceNumber ?? 'חשבונית ללא מספר'}
        actions={
          f.Status === 'generated' ? (
            <form action={markPaid.bind(null, invoice.id)}>
              <Button>סמן שולם</Button>
            </form>
          ) : undefined
        }
      />
      <Shared name={`invoice-${invoice.id}`}>
        <div className="sr-only">{f.InvoiceNumber}</div>
      </Shared>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <section className="space-y-6">
          <div className="panel p-6">
            <Timeline steps={steps} />
            {status === 'error' && <p className="mt-4 text-sm text-led-red">החשבונית נכשלה באימות: סכום לא חיובי או לקוח לא קיים. תקנו ב-Airtable או צרו חשבונית חדשה.</p>}
          </div>


          {items.length > 0 && (
            <div className="panel overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>פריט</TableHead>
                    <TableHead>מק״ט</TableHead>
                    <TableHead>כמות</TableHead>
                    <TableHead>מחיר</TableHead>
                    <TableHead>סה״כ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i, n) => (
                    <TableRow key={`${i.sku}-${n}`}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell dir="ltr" className="text-end font-mono text-xs text-ink-2">
                        {i.sku}
                      </TableCell>
                      <TableCell className="num">{i.qty}</TableCell>
                      <TableCell>
                        <Money value={i.price} />
                      </TableCell>
                      <TableCell>
                        <Money value={lineTotal(i)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="panel hud overflow-hidden">
            {driveId ? (
              <iframe title={`PDF ${f.InvoiceNumber ?? ''}`} src={`https://drive.google.com/file/d/${driveId}/preview`} className="w-full h-[720px] bg-chassis-2" allow="autoplay" />
            ) : (
              <div className="h-64 grid place-items-center text-ink-3 text-sm">{status === 'validated' || status === 'new' ? 'ה-PDF מופק על ידי n8n תוך דקה…' : 'אין מסמך'}</div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Tilt max={5}>
          <div className="panel p-5">
            <div className="text-[11px] font-medium tracking-wide text-ink-3">סטטוס</div>
            <div className="mt-1">
              <StatusLed table="Invoices" status={f.Status} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-2">לפני מע״מ</dt>
                <dd>
                  <Money value={f.Amount ?? 0} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">מע״מ {f.Amount && f.VatAmount ? `${Math.round((f.VatAmount / f.Amount) * 100)}%` : ''}</dt>
                <dd>
                  <Money value={f.VatAmount ?? 0} />
                </dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-rule-strong pt-3 text-base font-semibold">
                <dt>סה״כ לתשלום</dt>
                <dd className="text-signal glow-text">
                  <Money value={f.Total ?? 0} />
                </dd>
              </div>
            </dl>
          </div>
          </Tilt>

          <div className="panel p-5">
            <div className="text-[11px] font-medium tracking-wide text-ink-3">לקוח</div>
            {customer ? (
              <Link href={`/customers/${customer.id}`} transitionTypes={['nav-forward']} className="block mt-1 font-medium hover:text-inkblue">
                {customer.fields.Name}
              </Link>
            ) : (
              <div className="mt-1 text-led-red text-sm">לקוח {f.CustomerId} לא נמצא</div>
            )}
            <div className="text-xs text-ink-3 num">{f.CustomerId}</div>
            {customer?.fields.Email && (
              <div className="text-sm text-ink-2 mt-2" dir="ltr">
                {customer.fields.Email}
              </div>
            )}
            {customer?.fields.Phone && (
              <div className="text-sm text-ink-2 num" dir="ltr">
                {customer.fields.Phone}
              </div>
            )}
          </div>

          {f.PdfUrl && (
            <a href={f.PdfUrl} target="_blank" rel="noreferrer" className="block text-center text-sm text-inkblue hover:text-inkblue-hover">
              פתיחה ב-Google Drive ↗
            </a>
          )}
        </aside>
      </div>
    </DirectionalTransition>
  );
}
