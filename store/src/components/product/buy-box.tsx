import { StockBadge } from '@/components/catalog/stock-badge';
import { AddToCart, AskBotLink, type InstallOffer } from '@/components/product/add-to-cart';
import { inStock, isService } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import type { Product } from '@/lib/types';

/** אותן עובדות שמופיעות בעמוד המדיניות — לא הבטחה חדשה. */
const TRUST_GOODS = ['משלוח 29 ₪', 'חינם מעל 300', 'החזרה 14 יום'];
const TRUST_SERVICE = ['שירות בתיאום', 'ללא עלות משלוח', 'ביטול 14 יום'];

/**
 * Intent: כל מה שצריך כדי להחליט, בלי לגלול — קטגוריה, שם, מחיר, מלאי, פעולה.
 * נדבקת בגלילה כי ההחלטה מלווה את קריאת המפרט.
 * Hierarchy: שם (28/800) → מחיר (28 מונו) → מלאי → פעולה → אמון → בוט.
 * Palette: panel-1 על void; אזל מלאי מסמן את עצמו בגבול bad/30, לא בטקסט אדום.
 * Spacing: ריפוד 24, קו rule אחד שמפריד את "מה זה" מ"קח את זה".
 */
export function BuyBox({ product, install }: { product: Product; install: InstallOffer | null }) {
  const f = product.fields;
  const sku = f.Sku ?? product.id;
  const ok = inStock(product);
  const service = isService(product);
  const trust = service ? TRUST_SERVICE : TRUST_GOODS;

  return (
    <aside
      className={`rounded-[16px] border bg-panel-1 p-6 lg:sticky lg:top-24 ${ok ? 'border-rule' : 'border-bad/30'}`}
    >
      {f.Category && (
        <p className="font-mono text-[11px] leading-none tracking-[0.14em] text-glow-3">{f.Category}</p>
      )}
      <h1 className="mt-3 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em]">{f.Name}</h1>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="num text-[28px] leading-none font-medium text-glow">{ils(f.Price ?? 0)}</span>
        <span className="text-[12px] text-glow-3">כולל מע״מ</span>
      </div>

      {!service && <StockBadge ok={ok} className="mt-4" />}

      <div className="mt-6 border-t border-rule pt-6">
        <AddToCart
          sku={sku}
          name={f.Name}
          price={f.Price ?? 0}
          service={service}
          imageUrl={f.ImageUrl}
          ok={ok}
          install={install}
        />
      </div>

      <ul className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px] leading-5 text-glow-3">
        {trust.map((item, i) => (
          <li key={item} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>·</span>}
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-rule pt-3">
        <AskBotLink sku={sku} />
      </div>
    </aside>
  );
}
