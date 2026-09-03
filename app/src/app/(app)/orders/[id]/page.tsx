import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import type { CustomerFields, OrderFields } from '@/lib/types';
import { parseItems, lineTotal } from '@/lib/order-items';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { DirectionalTransition } from '@/components/motion/page-transition';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusSelect } from '../status-select';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await get<OrderFields>('Orders', id);
  if (!order) notFound();
  const f = order.fields;
  // CustomerId הוא קוד עסקי (CUST-000N) ולא מזהה רשומה, ולכן הקישור ללקוח עובר דרך חיפוש — כמו בעמוד החשבונית.
  const [customer] = f.CustomerId
    ? await list<CustomerFields>('Customers', { filter: `{CustomerId}='${escapeFormula(f.CustomerId)}'`, max: 1 })
    : [];
  const items = parseItems(f.Items);

  return (
    <DirectionalTransition>
      <nav className="mb-4 text-sm text-ink-3">
        <Link href="/orders" transitionTypes={['nav-back']} className="hover:text-ink">
          ← הזמנות
        </Link>
      </nav>
      <Header title={f.OrderNumber} kicker={dateIL(f.Created)} actions={<StatusLed table="Orders" status={f.Status} className="text-sm" />} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <section className="space-y-6">
          <div className="panel overflow-hidden">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-3">אין שורות בהזמנה הזו.</p>
            ) : (
              <Table label="שורות ההזמנה">
                <TableHeader>
                  <TableRow>
                    <TableHead>מק״ט</TableHead>
                    <TableHead>שם</TableHead>
                    <TableHead>כמות</TableHead>
                    <TableHead>מחיר</TableHead>
                    <TableHead>סה״כ שורה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i, n) => (
                    <TableRow key={`${i.sku}-${n}`}>
                      <TableCell dir="ltr" className="text-end font-mono text-xs text-ink-2">
                        {i.sku}
                      </TableCell>
                      <TableCell className="font-medium whitespace-normal">{i.name}</TableCell>
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
            )}
          </div>

          <div className="panel p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-2">ביניים</dt>
                <dd>
                  <Money value={f.Subtotal ?? 0} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">משלוח</dt>
                <dd>{f.Shipping ? <Money value={f.Shipping} /> : <span className="text-ink-3">חינם</span>}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">מע״מ כלול</dt>
                <dd>
                  <Money value={f.Vat ?? 0} />
                </dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-rule-strong pt-3 text-base font-semibold">
                <dt>סה״כ</dt>
                <dd className="text-signal glow-text">
                  <Money value={f.Total ?? 0} />
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="text-[12px] font-medium tracking-wide text-ink-3">סטטוס</div>
            <div className="mt-2">
              <OrderStatusSelect id={order.id} orderNumber={f.OrderNumber} status={f.Status} />
            </div>
            <p className="mt-2 text-xs text-ink-3">&quot;נשלחה&quot; סוגר גם את משימת המשלוח.</p>
          </div>

          <div className="panel p-5">
            <div className="text-[12px] font-medium tracking-wide text-ink-3">לקוח</div>
            {customer ? (
              <Link href={`/customers/${customer.id}`} transitionTypes={['nav-forward']} className="block mt-1 font-medium hover:text-inkblue">
                {f.Name}
              </Link>
            ) : (
              <div className="mt-1 font-medium">{f.Name}</div>
            )}
            {f.CustomerId && (
              <div className="text-xs text-ink-3 num" dir="ltr">
                {f.CustomerId}
              </div>
            )}
            {f.Email && (
              <div className="text-sm text-ink-2 mt-2" dir="ltr">
                {f.Email}
              </div>
            )}
            {f.Phone && (
              <div className="text-sm text-ink-2 num" dir="ltr">
                {f.Phone}
              </div>
            )}
            <div className="text-sm text-ink-2 mt-2">{[f.Address, f.City].filter(Boolean).join(', ') || 'אין כתובת — הזמנת שירות'}</div>
            {f.Note && <p className="mt-3 border-t border-rule pt-3 text-sm text-ink-2 whitespace-pre-wrap">{f.Note}</p>}
          </div>

          <div className="panel p-5">
            <div className="text-[12px] font-medium tracking-wide text-ink-3">חשבונית</div>
            {f.InvoiceNumber ? (
              <Link href={`/invoices?q=${encodeURIComponent(f.InvoiceNumber)}`} className="block mt-1 num text-inkblue hover:text-inkblue-hover" dir="ltr">
                {f.InvoiceNumber}
              </Link>
            ) : (
              <div className="mt-1 text-sm text-ink-3">טרם הופקה</div>
            )}
          </div>
        </aside>
      </div>
    </DirectionalTransition>
  );
}
