'use client';

import type { Ref } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { XIcon } from 'lucide-react';
import { Quantity } from '@/components/cart/quantity';
import type { CartLine as Line } from '@/lib/cart';
import { ils } from '@/lib/format';
import { EYEBROW } from '@/lib/ui';

/**
 * שורת עגלה. היררכיה: התמונה עוגן, השם הוא מה שקוראים, הסכום של השורה הוא
 * המספר שסופרים — לכן הוא בסוף השורה השנייה, מול הבורר, ולא נבלע בין המטא.
 * שירות אין לו תמונה, ולכן הוא מקבל תג טקסט באותו ריבוע 56 — הרשת נשמרת.
 *
 * `ref` נחשף כי `AnimatePresence mode="popLayout"` משכפל את הילד עם ref משלו.
 */
export function CartLine({
  line,
  onQty,
  onRemove,
  onNavigate,
  ref,
}: {
  line: Line;
  onQty: (qty: number) => void;
  onRemove: () => void;
  onNavigate: () => void;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, layout: { duration: 0.22 } }}
      className="flex gap-3 border-b border-rule py-4 last:border-b-0"
    >
      <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-sm border border-rule bg-panel-2">
        {line.service ? (
          <span className={EYEBROW}>שירות</span>
        ) : line.imageUrl ? (
          <Image src={line.imageUrl} alt={line.name} fill sizes="56px" className="object-cover" />
        ) : (
          <span className="num text-meta text-glow-4" dir="ltr">
            {line.sku}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-1">
          <Link
            href={`/products/${line.sku}`}
            transitionTypes={['nav-forward']}
            onClick={onNavigate}
            className="line-clamp-2 flex-1 text-sm leading-snug font-medium text-glow transition-colors hover:text-beam"
          >
            {line.name}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`הסרת ${line.name} מהסל`}
            className="-me-2 -mt-1.5 grid size-9 shrink-0 place-items-center rounded-sm text-glow-4 transition-colors hover:bg-panel-2 hover:text-bad"
          >
            <XIcon size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {/* .num רק על המספר — "ליחידה" הוא עברית ואין לה גליפים ב-JetBrains Mono. */}
        <p className="mt-0.5 text-meta text-glow-2">
          <span className="num">{ils(line.price)}</span> ליחידה
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Quantity value={line.qty} onChange={onQty} />
          <span className="num text-sm font-medium text-glow">{ils(line.price * line.qty)}</span>
        </div>
      </div>
    </motion.div>
  );
}
