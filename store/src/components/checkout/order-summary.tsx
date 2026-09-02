'use client';

import Image from 'next/image';
import type { Cart, totals as computeTotals } from '@/lib/cart';
import { ils } from '@/lib/format';

function Row({ label, children, strong = false }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className={strong ? 'font-medium text-glow' : 'text-glow-2'}>{label}</span>
      <span className={strong ? 'text-glow' : 'text-glow-2'}>{children}</span>
    </div>
  );
}

/**
 * Intent: קבלה, לא חנות. הסיכום מאשר מה קונים ובכמה — ולכן הוא שקט:
 * שום beam, שום כפתור. המוקד היחיד במסך הוא "אישור הזמנה" שממול.
 * Hierarchy: סה״כ (22 מונו) > שמות הפריטים (14) > כמות/מחיר יחידה (11, glow-3).
 * Palette: panel-1 על void, קו rule מפריד את השורות מהסכומים; bad רק לשורה שאזלה.
 * Depth: גבול יחיד. אין הילה כאן — היא שמורה ל-CTA.
 * Spacing: ריפוד 16, שורה 12 בין פריטים, 8 בין הסכומים.
 */
export function OrderSummary({
  lines,
  totals,
  outOfStock = [],
  className = 'rounded-lg border border-rule bg-panel-1 p-4',
}: {
  lines: Cart['lines'];
  totals: ReturnType<typeof computeTotals>;
  outOfStock?: string[];
  /** במובייל הסיכום כבר יושב בתוך `details` ממוסגר — שם מעבירים ריפוד בלבד. */
  className?: string;
}) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {lines.map((line) => {
          const missing = outOfStock.includes(line.sku);
          return (
            <li
              key={line.sku}
              className={`flex items-center gap-3 rounded-sm ${missing ? 'bg-bad/5 p-2 ring-1 ring-bad/40' : ''}`}
            >
              <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm border border-rule bg-panel-2">
                {line.service ? (
                  <span className="text-meta text-glow-3">שירות</span>
                ) : line.imageUrl ? (
                  <Image src={line.imageUrl} alt={line.name} fill sizes="40px" className="object-cover" />
                ) : (
                  <span className="num text-meta text-glow-3" dir="ltr">
                    {line.sku}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-glow">{line.name}</p>
                <p className="mt-0.5 text-meta text-glow-3">
                  <span className="num">{line.qty}</span>
                  <span aria-hidden> × </span>
                  <span className="sr-only"> יחידות במחיר </span>
                  <span className="num">{ils(line.price)}</span>
                  {missing && <span className="ms-2 text-bad">אזל</span>}
                </p>
              </div>

              <span className="num shrink-0 text-sm text-glow-2">{ils(line.price * line.qty)}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2 border-t border-rule pt-4">
        <Row label="סכום ביניים">
          <span className="num">{ils(totals.subtotal)}</span>
        </Row>
        <Row label="משלוח">
          {totals.shipping > 0 ? (
            <span className="num">{ils(totals.shipping)}</span>
          ) : (
            <span className="text-ok">חינם</span>
          )}
        </Row>
        <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
          <span className="text-sm font-medium text-glow">סה״כ</span>
          <span className="num text-2xl leading-none font-medium text-glow">{ils(totals.total)}</span>
        </div>
        <p className="text-end text-meta text-glow-3">
          כולל מע״מ <span className="num">{ils(totals.vat)}</span>
        </p>
      </div>
    </div>
  );
}
