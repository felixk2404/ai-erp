import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import type { CustomerFields, OrderFields, OrderStatus } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { parseItems, lineTotal } from '@/lib/order-items';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { Timeline, type TimelineStep } from '@/components/timeline';
import { ActionButton } from '@/components/forms/action-button';
import { DirectionalTransition } from '@/components/motion/page-transition';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusSelect } from '../status-select';
import { setOrderStatus } from '../actions';

export const dynamic = 'force-dynamic';

/** ציר ההתקדמות של הזמנה, כמו שהלקוח רואה אותו בחנות (`store/src/lib/order-status.ts`).
 *  `cancelled` אינו שלב חמישי אלא מצב חריג, ולכן הוא נופל מהציר ומוצג בנפרד. */
const STEPS = ['new', 'confirmed', 'shipped', 'delivered'] as const;

/** הצעד הבא — הפעולה היחידה שהעמוד הזה קיים בשבילה. הזמנה שנמסרה או בוטלה כבר לא מציעה כלום. */
const NEXT: Partial<Record<string, { status: OrderStatus; label: string }>> = {
  new: { status: 'confirmed', label: 'סמן כאושרה' },
  confirmed: { status: 'shipped', label: 'סמן כנשלחה' },
  shipped: { status: 'delivered', label: 'סמן כנמסרה' },
};

const LABEL = 'text-[12px] font-medium tracking-wide text-readout-3';

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

  const status = f.Status ?? 'new';
  const cancelled = status === 'cancelled';
  const idx = (STEPS as readonly string[]).indexOf(status);
  const steps: TimelineStep[] = STEPS.map((s, i) => ({
    label: statusMeta('Orders', s).label,
    hint: i === 0 ? dateIL(f.Created) : undefined,
    state: cancelled ? (i === 0 ? 'error' : 'todo') : i < idx ? 'done' : i === idx ? (s === 'delivered' ? 'done' : 'current') : 'todo',
  }));
  const next = NEXT[status];

  return (
    <DirectionalTransition>
      <div className="max-w-5xl">
        <nav className="mb-4 text-sm text-readout-3">
          <Link href="/orders" transitionTypes={['nav-back']} className="hover:text-readout">
            ← הזמנות
          </Link>
        </nav>
        <Header
          title={f.OrderNumber}
          kicker={dateIL(f.Created)}
          actions={
            next ? (
              <ActionButton action={setOrderStatus.bind(null, order.id, f.OrderNumber, next.status)} variant="default" size="default">
                {next.label}
              </ActionButton>
            ) : undefined
          }
        />

        <div className="panel p-6 mb-6">
          <Timeline steps={steps} />
          {cancelled && <p className="mt-4 text-sm text-led-red">ההזמנה בוטלה. אין מה לשלוח — אפשר להחזיר אותה לסטטוס קודם בתיבת השינוי שבצד.</p>}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* min-w-0: בלי זה רוחב הטבלה הפנימית מרחיב את עמודת הגריד ומגלגל את כל העמוד לרוחב בנייד */}
          <section className="space-y-6 min-w-0">
            <div className="panel overflow-hidden">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-readout-3">אין שורות בהזמנה הזו.</p>
              ) : (
                <Table label="שורות ההזמנה">
                  <TableHeader>
                    <TableRow>
                      <TableHead>מק״ט</TableHead>
                      <TableHead>שם</TableHead>
                      <TableHead>כמות</TableHead>
                      <TableHead className="text-end">מחיר</TableHead>
                      <TableHead className="text-end">סה״כ שורה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((i, n) => (
                      <TableRow key={`${i.sku}-${n}`}>
                        <TableCell dir="ltr" className="text-end font-mono text-xs text-readout-2">
                          {i.sku}
                        </TableCell>
                        <TableCell className="font-medium whitespace-normal">{i.name}</TableCell>
                        <TableCell className="num">{i.qty}</TableCell>
                        <TableCell dir="ltr" className="text-end">
                          <Money value={i.price} />
                        </TableCell>
                        <TableCell dir="ltr" className="text-end">
                          <Money value={lineTotal(i)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>

          {/* בנייד הסטטוס והסכומים לפני שורות ההזמנה — זו התשובה לשאלה שבגללה פותחים את העמוד */}
          <aside className="space-y-4 order-first lg:order-none">
            <div className="panel p-5">
              <div className={LABEL}>סטטוס</div>
              <div className="mt-1">
                <StatusLed table="Orders" status={f.Status} />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-readout-2">ביניים</dt>
                  <dd dir="ltr" className="text-end num">
                    <Money value={f.Subtotal ?? 0} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-readout-2">משלוח</dt>
                  <dd dir="ltr" className="text-end num">
                    {f.Shipping ? <Money value={f.Shipping} /> : <span className="text-readout-3">חינם</span>}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-readout-2">מע״מ כלול</dt>
                  <dd dir="ltr" className="text-end num">
                    <Money value={f.Vat ?? 0} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-dashed border-rule-strong pt-3 text-base font-semibold">
                  <dt>סה״כ</dt>
                  <dd dir="ltr" className="text-end num text-signal glow-text">
                    <Money value={f.Total ?? 0} />
                  </dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-rule pt-4 flex items-center justify-between gap-3">
                <span className={LABEL}>שינוי סטטוס</span>
                <OrderStatusSelect id={order.id} orderNumber={f.OrderNumber} status={f.Status} />
              </div>
              <p className="mt-2 text-xs text-readout-3">״נשלחה״ סוגר גם את משימת המשלוח.</p>
            </div>

            <div className="panel p-5">
              <div className={LABEL}>לקוח</div>
              {customer ? (
                <Link href={`/customers/${customer.id}`} transitionTypes={['nav-forward']} className="block mt-1 font-medium text-signal hover:underline">
                  {f.Name}
                </Link>
              ) : (
                <div className="mt-1 font-medium">{f.Name}</div>
              )}
              {f.CustomerId && (
                <div className="text-xs text-readout-3 num" dir="ltr">
                  {f.CustomerId}
                </div>
              )}
              {f.Email && (
                <div className="text-sm text-readout-2 mt-2" dir="ltr">
                  {f.Email}
                </div>
              )}
              {f.Phone && (
                <div className="text-sm text-readout-2 num" dir="ltr">
                  {f.Phone}
                </div>
              )}
              <div className="text-sm text-readout-2 mt-2">{[f.Address, f.City].filter(Boolean).join(', ') || 'אין כתובת — הזמנת שירות'}</div>
              {f.Note && (
                <div className="mt-3 border-t border-rule pt-3">
                  <div className={LABEL}>הערה</div>
                  <p className="mt-1 text-sm text-readout-2 whitespace-pre-wrap">{f.Note}</p>
                </div>
              )}
            </div>

            <div className="panel p-5">
              <div className={LABEL}>חשבונית</div>
              {f.InvoiceNumber ? (
                <Link href={`/invoices?q=${encodeURIComponent(f.InvoiceNumber)}`} className="block mt-1 num text-readout-2 hover:text-signal transition-colors" dir="ltr">
                  {f.InvoiceNumber}
                </Link>
              ) : (
                <div className="mt-1 text-sm text-readout-3">טרם הופקה</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DirectionalTransition>
  );
}
