import { StockBadge } from '@/components/catalog/stock-badge';
import { inStock, isService } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import type { Product } from '@/lib/types';

/**
 * Intent: אותה "רשת מפרט" שהיא החתימה של החנות — כאן בגרסת פריט יחיד.
 * Hierarchy: תווית ב-glow-3 בעמודה קבועה, ערך ב-glow; המספרים במונו כדי
 * שהעין תזהה אותם כנתון ולא כטקסט.
 * שירות לא מקבל שורת זמינות — "במלאי" חסר משמעות לשירות שמתואם טלפונית.
 */
export function DetailsTable({ product }: { product: Product }) {
  const f = product.fields;
  const sku = f.Sku ?? product.id;

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'מק״ט',
      value: (
        <span dir="ltr" className="num inline-block text-glow-2">
          {sku}
        </span>
      ),
    },
    { label: 'קטגוריה', value: f.Category ?? '—' },
    ...(isService(product) ? [] : [{ label: 'זמינות', value: <StockBadge ok={inStock(product)} /> }]),
    {
      label: 'מחיר כולל מע״מ',
      value: <span className="num text-glow">{ils(f.Price ?? 0)}</span>,
    },
  ];

  return (
    <section>
      <h2 className="font-mono text-[11px] leading-none tracking-[0.14em] text-glow-3">פרטים</h2>
      <dl className="mt-4 overflow-hidden rounded-[12px] border border-rule bg-panel-1 text-[14px]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-t border-rule px-4 py-3 first:border-t-0"
          >
            <dt className="text-glow-3">{row.label}</dt>
            <dd className="text-glow">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
