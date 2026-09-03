import Link from 'next/link';
import { list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import { ORDER_STATUSES, type OrderFields } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { parseItems, itemCount } from '@/lib/order-items';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setOrderStatus } from './actions';

export const dynamic = 'force-dynamic';

type SP = { status?: string; q?: string };

/** קישור זהות (מספר ההזמנה) מול הפניה חוצה־טבלה (מספר החשבונית) — שתי דרגות, אותה מוסכמה בכל הרשימות. */
const IDENTITY_LINK = 'text-signal hover:underline';
const CROSS_LINK = 'text-readout-2 hover:text-signal transition-colors';

/** הסטטוסים שבהם המשלוח עוד לא יצא — רק להם יש טעם בכפתור "סמן כנשלחה" בשורה. */
const OPEN_STATUSES = new Set<string>(['new', 'confirmed']);

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status: requested = '', q = '' } = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(requested) ? requested : '';

  const filters: string[] = [];
  if (status) filters.push(`{Status}='${escapeFormula(status)}'`);
  if (q.trim()) {
    const needle = escapeFormula(q.trim().toLowerCase());
    filters.push(`OR(FIND('${needle}', LOWER({OrderNumber})), FIND('${needle}', LOWER({Name})), FIND('${needle}', LOWER({Email})))`);
  }
  const orders = await list<OrderFields>('Orders', {
    filter: filters.length ? `AND(${filters.join(',')})` : undefined,
    sort: [{ field: 'Created', direction: 'desc' }],
  });

  const href = (s: string) => `/orders?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) })}`.replace(/\?$/, '');

  return (
    <>
      <Header title="הזמנות" />

      <form className="flex flex-wrap items-center gap-2 mb-3" role="search">
        <input type="hidden" name="status" value={status} />
        <Input name="q" defaultValue={q} placeholder="חיפוש לפי מספר או לקוח" className="max-w-xs" aria-label="חיפוש" />
        <Button type="submit" variant="secondary">
          חיפוש
        </Button>
        {q && (
          <Link href={href(status)} className={CROSS_LINK + ' text-sm'}>
            נקה
          </Link>
        )}
      </form>

      <nav aria-label="סינון לפי סטטוס" className="flex flex-wrap gap-1 mb-4">
        <Link href={href('')} className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${!status ? 'bg-signal-soft text-signal font-medium' : 'text-readout-2 hover:bg-chassis-2'}`}>
          הכל
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={href(s)}
            className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${status === s ? 'bg-signal-soft text-signal font-medium' : 'text-readout-2 hover:bg-chassis-2'}`}
          >
            {statusMeta('Orders', s).label}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState title="אין הזמנות" hint={status || q ? 'נסה סינון אחר' : 'הזמנות מהחנות יופיעו כאן'} />
        ) : (
          <Table label="הזמנות">
            <TableHeader>
              <TableRow>
                <TableHead>מספר הזמנה</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead className="hidden sm:table-cell">מוצרים</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="hidden md:table-cell">חשבונית</TableHead>
                <TableHead className="hidden md:table-cell">תאריך</TableHead>
                <TableHead className="w-32 hidden sm:table-cell" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell dir="ltr" className="num font-medium text-end">
                    <Link href={`/orders/${o.id}`} transitionTypes={['nav-forward']} className={IDENTITY_LINK}>
                      {o.fields.OrderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.fields.Name}
                    {/* תת־שורה תמיד, גם כשאין עיר — אחרת גובה השורות משתנה משורה לשורה */}
                    <span className="block text-xs text-readout-3">{o.fields.City || o.fields.CustomerId || '—'}</span>
                  </TableCell>
                  <TableCell className="num text-readout-2 hidden sm:table-cell">{itemCount(parseItems(o.fields.Items))}</TableCell>
                  <TableCell>
                    <Money value={o.fields.Total ?? 0} />
                  </TableCell>
                  <TableCell>
                    <StatusLed table="Orders" status={o.fields.Status} />
                  </TableCell>
                  <TableCell dir="ltr" className="num text-end hidden md:table-cell">
                    {o.fields.InvoiceNumber ? (
                      <Link href={`/invoices?q=${encodeURIComponent(o.fields.InvoiceNumber)}`} className={CROSS_LINK}>
                        {o.fields.InvoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-readout-3">—</span>
                    )}
                  </TableCell>
                  <TableCell className="num text-readout-2 hidden md:table-cell">{dateIL(o.fields.Created)}</TableCell>
                  {/* קיצור הדרך לשליחה הוא פעולת שולחן עבודה: בנייד הוא היה דוחף את עמודת הסטטוס מהמסך,
                      והכפתור הראשי בעמוד ההזמנה נמצא במרחק הקשה אחת */}
                  <TableCell className="hidden sm:table-cell">
                    {OPEN_STATUSES.has(o.fields.Status ?? 'new') && (
                      <ActionButton action={setOrderStatus.bind(null, o.id, o.fields.OrderNumber, 'shipped')} aria-label={`סמן כנשלחה — ${o.fields.OrderNumber}`}>
                        סמן כנשלחה
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {orders.length > 0 && (
        <p className="text-xs text-readout-3 mt-3">ההזמנות נוצרות בחנות יחד עם החשבונית. סימון הזמנה כ״נשלחה״ סוגר גם את משימת המשלוח שלה.</p>
      )}
    </>
  );
}
