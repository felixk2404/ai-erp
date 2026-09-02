'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, stagger, useReducedMotion } from 'motion/react';
import { PackageIcon } from 'lucide-react';
import { Spotlight } from '@/components/motion/spotlight';
import { WordReveal } from '@/components/motion/word-reveal';
import { Shared } from '@/components/motion/page-transition';
import { StockBadge } from '@/components/catalog/stock-badge';
import { AskBot } from '@/components/home/ask-bot';
import { buttonVariants } from '@/components/ui/button';
import { inStock } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

/** נקודת ההתחלה זהה בשני מצבי התנועה — זה מה שהשרת מרנדר, ולכן אסור שיהיה תלוי לקוח. */
const HIDDEN = { opacity: 0, y: 20, filter: 'blur(10px)' };
const SHOWN = { opacity: 1, y: 0, filter: 'blur(0px)' };

const scene = { hidden: {}, visible: { transition: { delayChildren: stagger(0.1) } } };
const column = { hidden: {}, visible: { transition: { delayChildren: stagger(0.07) } } };

/** הפריט "מתמקד": יוצא מטושטש ונמוך ונוחת חד — כמו עדשה שנתפסת על האובייקט. */
const item = {
  hidden: HIDDEN,
  visible: { ...SHOWN, transition: { type: 'spring' as const, stiffness: 100, damping: 20 } },
};

/** תנועה מופחתת: אותו DOM, אותם ערכים — רק בלי המסע. הבחירה נעשית בלקוח בלבד. */
const itemCalm = {
  hidden: HIDDEN,
  visible: {
    ...SHOWN,
    transition: { opacity: { duration: 0.3, ease: 'easeOut' as const }, y: { duration: 0 }, filter: { duration: 0 } },
  },
};

const FACTS = [
  { label: 'משלוח', value: '29 ₪' },
  { label: 'חינם מעל', value: '300 ₪' },
  { label: 'החזרה', value: '14 יום' },
] as const;

/**
 * Intent: חדר תצוגה חשוך שבו פריט אחד עומד באור. הכותרת מסבירה את האור, לא מתחרה בו.
 * Hierarchy: מוצר הדגל (דיסקה מוארת, 460px) → כותרת → CTA ראשי → מפרט מונו. כל השאר מודמם.
 * Palette: void מלא רוחב, panel-2 לדיסקה, beam רק בכפתור אחד ובהילה הרכה מסביב לדיסקה.
 * Depth: קווי rule + הילה רדיאלית + טבעת מקווקוות מסתובבת. אין צל אחד בכל הסקשן.
 * Typography: eyebrow מונו 11, h1 Heebo 800 44→64, משנה 18/1.5 glow-2, מפרט מונו 13.
 * Spacing: מלא-רוחב עם תוכן מיושר ל-1280, min-h 80dvh, פער 40px בין הבלוקים בעמודת הטקסט.
 */
export function Hero({ product, count }: { product: Product; count: number }) {
  const reduce = useReducedMotion();
  const enter = reduce ? itemCalm : item;
  const f = product.fields;
  const sku = f.Sku ?? product.id;

  return (
    <Spotlight className="-mt-8 mx-[calc(50%-50vw)] border-b border-rule px-[max(20px,calc(50vw-640px))] pt-12 pb-16 lg:pt-16 lg:pb-24">
      <motion.div
        variants={scene}
        initial="hidden"
        animate="visible"
        className="grid min-h-[80dvh] items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16"
      >
        <motion.div variants={column} className="flex flex-col items-start">
          <motion.p variants={enter} className="font-mono text-[11px] tracking-[0.08em] text-glow-3">
            חדר תצוגה · <span className="num">{count}</span> מוצרים · אחריות יבואן
          </motion.p>

          <h1 className="mt-5 text-[44px] leading-[1.02] font-extrabold tracking-[-0.02em] text-balance sm:text-[56px] lg:text-[64px]">
            <WordReveal text="טכנולוגיה שרואים." />
          </h1>

          <motion.p variants={enter} className="mt-5 max-w-[42ch] text-[18px] leading-[1.5] text-glow-2">
            מוצרים מקוריים. שירות AI. משלוח עד הבית.
          </motion.p>

          <motion.div variants={enter} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              transitionTypes={['nav-forward']}
              className={cn(buttonVariants(), 'h-12 rounded-[8px] px-6 text-[15px]')}
            >
              לקטלוג
            </Link>
            <AskBot className={cn(buttonVariants({ variant: 'outline' }), 'h-12 rounded-[8px] px-6 text-[15px]')}>
              שאל את הבוט
            </AskBot>
          </motion.div>

          <motion.dl
            variants={enter}
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[13px] text-glow-3"
          >
            {FACTS.map((fact, i) => (
              <div key={fact.label} className="flex items-center gap-2">
                <dt>{fact.label}</dt>
                <dd className="num text-glow-2">{fact.value}</dd>
                {/* מפריד *עוקב* ולא מוביל: בשבירת שורה הנקודה נשארת בסוף השורה ולא פותחת אותה. */}
                {i < FACTS.length - 1 && (
                  <span aria-hidden className="text-glow-4">
                    ·
                  </span>
                )}
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div variants={enter} className="relative mx-auto w-full max-w-[380px] lg:max-w-[500px]">
          {/* קישור אחד על כל הדיסקה: מסתכלים על הפריט, לוחצים על הפריט. כרטיס המפרט הוא התווית שלו. */}
          <Link href={`/products/${sku}`} transitionTypes={['nav-forward']} className="group relative block aspect-square">
            {/* overflow-clip כאן ולא על הקישור: תיבת הגבול של הטבעת המסתובבת היא ריבוע מסובב (×1.41),
                ובלעדיו היא מרחיבה את גלילת הדף במובייל — אבל כרטיס המפרט חייב להישאר *מחוץ* לקליפ. */}
            <div className="absolute inset-0 overflow-clip rounded-full">
            {/* הטבעת המקווקוות: סיבוב איטי שמסמן "פריט בתצוגה". CSS ולא JS, כדי ש-prefers-reduced-motion יכבה אותו בוודאות. */}
            <div
              aria-hidden
              className="absolute inset-[4%] animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-rule-strong motion-reduce:animate-none"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-full [background:radial-gradient(closest-side,var(--color-beam-soft),transparent)]"
            />

            {/* הדיסקה צפה 6 שניות — הפריט "מרחף" בתוך האור. reducedMotion="user" הגלובלי מבטל transform. */}
            <motion.div
              animate={reduce ? undefined : { y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-[10%] overflow-hidden rounded-full border border-rule bg-panel-2"
            >
              <Shared name={`product-image-${sku}`}>
                {f.ImageUrl ? (
                  <Image
                    src={f.ImageUrl}
                    alt={f.Name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 80vw, 400px"
                    data-fly-src={sku}
                    className="object-cover [filter:saturate(0.18)_brightness(0.88)_contrast(1.08)] [mask-image:radial-gradient(closest-side,#000_42%,transparent_94%)]"
                  />
                ) : (
                  <div data-fly-src={sku} className="grid h-full place-items-center text-glow-4">
                    <PackageIcon size={40} strokeWidth={1} aria-hidden />
                  </div>
                )}
              </Shared>
            </motion.div>
            </div>

            <span className="absolute bottom-[2%] start-0 z-10 block w-[190px] sm:w-[210px] lg:start-[-5%] rounded-[12px] border border-rule bg-panel-2/90 p-3 backdrop-blur-sm transition-colors group-hover:border-rule-strong">
              <span dir="ltr" className="num block text-[11px] tracking-[0.06em] text-glow-3">
                {sku}
              </span>
              <span className="mt-1 line-clamp-2 text-[14px] leading-[1.3] font-medium text-glow">{f.Name}</span>
              <span className="mt-2 flex items-center justify-between gap-2 border-t border-rule pt-2">
                <StockBadge ok={inStock(product)} />
                <span className="num text-[14px] text-glow">{ils(f.Price ?? 0)}</span>
              </span>
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </Spotlight>
  );
}
