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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requested = '' } = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(requested) ? requested : '';
  const orders = await list<OrderFields>('Orders', {
    filter: status ? `{Status}='${escapeFormula(status)}'` : undefined,
    sort: [{ field: 'Created', direction: 'desc' }],
  });

  return (
    <>
      <Header title="הזמנות" />

      <nav aria-label="סינון לפי סטטוס" className="flex flex-wrap gap-1 mb-4">
        <Link
          href="/orders"
          className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${!status ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}
        >
          הכל
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/orders?status=${s}`}
            className={`h-9 px-3 inline-flex items-center rounded-md text-sm ${status === s ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}
          >
            {statusMeta('Orders', s).label}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState title="אין הזמנות" hint={status ? 'אין הזמנות בסטטוס הזה' : 'הזמנות מהחנות יופיעו כאן'} />
        ) : (
          <Table label="הזמנות">
            <TableHeader>
              <TableRow>
                <TableHead>מספר הזמנה</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>מוצרים</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>חשבונית</TableHead>
                <TableHead>תאריך</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell dir="ltr" className="num font-medium text-end">
                    <Link href={`/orders/${o.id}`} transitionTypes={['nav-forward']} className="hover:text-inkblue">
                      {o.fields.OrderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.fields.Name}
                    {o.fields.City && <span className="block text-xs text-ink-3">{o.fields.City}</span>}
                  </TableCell>
                  <TableCell className="num text-ink-2">{itemCount(parseItems(o.fields.Items))}</TableCell>
                  <TableCell>
                    <Money value={o.fields.Total ?? 0} />
                  </TableCell>
                  <TableCell>
                    <StatusLed table="Orders" status={o.fields.Status} />
                  </TableCell>
                  <TableCell dir="ltr" className="num text-end">
                    {o.fields.InvoiceNumber ? (
                      <Link href={`/invoices?q=${encodeURIComponent(o.fields.InvoiceNumber)}`} className="text-inkblue hover:text-inkblue-hover">
                        {o.fields.InvoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </TableCell>
                  <TableCell className="num text-ink-2">{dateIL(o.fields.Created)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {orders.length > 0 && (
        <p className="text-xs text-ink-3 mt-3">
          ההזמנות נוצרות בחנות (WF10) יחד עם החשבונית. סימון הזמנה כ״נשלחה״ סוגר גם את משימת המשלוח שלה.
        </p>
      )}
    </>
  );
}
