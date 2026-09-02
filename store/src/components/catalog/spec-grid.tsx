'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { StockBadge } from '@/components/catalog/stock-badge';
import { PriceButton } from '@/components/catalog/price-button';
import { highlights, inStock } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import type { Product } from '@/lib/types';

const HEAD = 'px-4 py-3 text-[11px] leading-none font-medium tracking-[0.12em] text-glow-3';
const CELL = 'px-4 py-3 align-middle';

/**
 * החתימה של החנות: כל פריט — גם שירות — הוא שורה באותה רשת מפרט.
 * העין סורקת עמודה אחת (מחיר, מלאי) במקום 34 כרטיסים. המק"ט והמחיר במונו עם
 * tabular-nums כדי שהעמודות לא ירקדו בהחלפת סינון; השמות בעברית נשארים בהיבו.
 * במובייל הטבלה גוללת בתוך עצמה. ה-`relative` על המעטפת הכרחי: בלעדיו גלישת
 * הטבלה ב-RTL דולפת ל-scrollWidth של הדף ומזיזה את כל העמוד הצידה.
 */
export function SpecGrid({ products }: { products: Product[] }) {
  return (
    <div className="relative overflow-x-auto rounded-[12px] border border-rule">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[26%]" />
          <col className="w-[25%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-rule-strong">
            <th scope="col" className={`${HEAD} text-start`}>
              מק&quot;ט
            </th>
            <th scope="col" className={`${HEAD} text-start`}>
              שם
            </th>
            <th scope="col" className={`${HEAD} text-start`}>
              מפרט
            </th>
            <th scope="col" className={`${HEAD} text-start`}>
              מלאי
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
            const f = p.fields;
            const sku = f.Sku ?? p.id;
            return (
              <motion.tr
                key={sku}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                className="border-t border-rule transition-colors first:border-t-0 hover:bg-panel-1"
              >
                <td className={CELL}>
                  <span dir="ltr" className="num text-[13px] text-glow-3">
                    {sku}
                  </span>
                </td>
                <td className={CELL}>
                  <Link
                    href={`/products/${sku}`}
                    transitionTypes={['nav-forward']}
                    className="line-clamp-2 text-[14px] font-medium text-glow underline-offset-4 hover:underline"
                  >
                    {f.Name}
                  </Link>
                </td>
                <td className={`${CELL} text-[14px] whitespace-normal text-glow-3`}>
                  <span className="line-clamp-2">{highlights(p)[0]}</span>
                </td>
                <td className={CELL}>
                  <StockBadge ok={inStock(p)} />
                </td>
                <td className={`${CELL} num text-end text-[14px] text-glow`}>{ils(f.Price ?? 0)}</td>
                <td className={`${CELL} text-end`}>
                  <PriceButton product={p} compact />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
