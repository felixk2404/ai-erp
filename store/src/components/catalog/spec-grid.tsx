'use client';

import Link from 'next/link';
import { StockBadge } from '@/components/catalog/stock-badge';
import { PriceButton } from '@/components/catalog/price-button';
import { ils, modelName } from '@/lib/format';
import { EYEBROW } from '@/lib/ui';
import type { ProductCardData } from '@/lib/catalog-filter';

const HEAD = `px-4 py-3 ${EYEBROW}`;
const CELL = 'px-4 py-3 align-middle';
/** חשיפה ישירות על השורה — CSS, כדי שהטבלה תגיע גלויה מהשרת. */
const revealAt = (i: number) => ({ animationDelay: `${Math.min(i * 0.04, 0.4)}s` });

/**
 * החתימה של החנות: כל פריט — גם שירות — הוא שורה באותה רשת מפרט.
 * העין סורקת עמודה אחת (מחיר, מלאי) במקום 34 כרטיסים. המק"ט והמחיר במונו עם
 * tabular-nums כדי שהעמודות לא ירקדו בהחלפת סינון; השמות בעברית נשארים בהיבו.
 * מתחת ל-md אין טבלה אלא בלוקים מוערמים — טלפון לא אמור לגלול לצדדים.
 */
export function SpecGrid({ products }: { products: ProductCardData[] }) {
  return (
    <>
      <ul className="border-t border-rule md:hidden">
        {products.map((p, i) => {
          const sku = p.sku;
          return (
            <li key={sku} data-reveal-row style={revealAt(i)} className="border-b border-rule py-3">
              <div className="flex items-baseline gap-2">
                <span dir="ltr" className="num shrink-0 text-body text-glow-3">
                  {sku}
                </span>
                <span aria-hidden className="text-glow-4">
                  ·
                </span>
                <Link
                  href={`/products/${sku}`}
                  transitionTypes={['nav-forward']}
                  className="line-clamp-1 text-body font-medium text-glow"
                >
                  {modelName(p.name)}
                </Link>
              </div>
              <p className="mt-1 line-clamp-2 text-body text-glow-3">{p.highlights[0]}</p>
              <div className="mt-2 flex items-center gap-3">
                <StockBadge ok={p.inStock} />
                <span className="num text-lg text-glow">{ils(p.price)}</span>
                <span className="ms-auto">
                  <PriceButton product={p} compact />
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 2.1.1: `overflow-x-auto` בלי `tabIndex` הופך את העמודות שמעבר לקצה
          לבלתי-נגישות לגמרי בלי עכבר — הטבלה היא `min-w-[720px]`. */}
      <div
        role="region"
        aria-label="טבלת המוצרים"
        tabIndex={0}
        className="relative mx-auto hidden max-w-[980px] overflow-x-auto rounded-lg border border-rule md:block"
      >
        <table className="w-full min-w-[720px] table-fixed border-collapse">
          <caption className="sr-only">טבלת המוצרים</caption>
          <colgroup>
            <col className="w-[8rem]" />
            <col />
            <col />
            <col className="w-[7rem]" />
            <col className="w-[8rem]" />
            <col className="w-[6rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-rule-strong">
              <th scope="col" className={`${HEAD} text-start`}>
                מק״ט
              </th>
              <th scope="col" className={`${HEAD} text-start`}>
                מוצר
              </th>
              <th scope="col" className={`${HEAD} text-start`}>
                מפרט
              </th>
              <th scope="col" className={`${HEAD} text-start`}>
                זמינות
              </th>
              <th scope="col" className={`${HEAD} text-end`}>
                מחיר
              </th>
              <th scope="col" className={`${HEAD} text-start`}>
                <span className="sr-only">הוספה לסל</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const sku = p.sku;
              return (
                <tr
                  key={sku}
                  data-reveal-row
                  style={revealAt(i)}
                  className="border-t border-rule transition-colors first:border-t-0 hover:bg-panel-1"
                >
                  <td className={CELL}>
                    <span dir="ltr" className="num text-body text-glow-3">
                      {sku}
                    </span>
                  </td>
                  <td className={CELL}>
                    <Link
                      href={`/products/${sku}`}
                      transitionTypes={['nav-forward']}
                      className="line-clamp-2 text-body text-glow-2 underline-offset-4 hover:text-glow hover:underline"
                    >
                      {modelName(p.name)}
                    </Link>
                  </td>
                  <td className={`${CELL} text-body whitespace-normal text-glow-3`}>
                    <span className="line-clamp-2">{p.highlights[0]}</span>
                  </td>
                  <td className={CELL}>
                    <StockBadge ok={p.inStock} />
                  </td>
                  <td className={`${CELL} num text-end text-lg text-glow`}>{ils(p.price)}</td>
                  <td className={`${CELL} text-end`}>
                    <PriceButton product={p} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
