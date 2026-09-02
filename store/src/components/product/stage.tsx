import Image from 'next/image';
import { PackageIcon } from 'lucide-react';
import { Spotlight } from '@/components/motion/spotlight';
import { Shared } from '@/components/motion/page-transition';
import type { Product } from '@/lib/types';

const SIZES = '(max-width: 640px) 70vw, (max-width: 1024px) 55vw, 520px';

/**
 * Intent: אותו חלון ראווה של ה-hero, בלי הצף ובלי הטבעת — כאן כבר בחרו את הפריט,
 * והתפקיד היחיד של הבמה הוא להאיר אותו. זה המוקד היחיד של העמוד.
 * Hierarchy: הילת beam → דיסקת panel-2 → המוצר → תג המק"ט בפינה.
 * Depth: גבול + הילה רדיאלית בלבד, בלי צל (חוזה הקראפט).
 *
 * מסכת radial מכבה את הרקע הקרמי של הצילום בשוליים כדי שהתמונה תשב בתוך האור
 * ולא כריבוע בהיר על כהה. בניגוד ל-hero, אין חיתוך עגול קשיח ואין דה-סטורציה:
 * בעמוד המוצר הקונה חייב לראות את הפריט כולו ובצבע האמיתי שלו.
 * `Shared` עוטף רק את התמונה כדי שהמורף מהכרטיס יזוז על אותו object-cover.
 */
export function Stage({ product }: { product: Product }) {
  const f = product.fields;
  const sku = f.Sku ?? product.id;

  return (
    <Spotlight className="rounded-[16px] border border-rule bg-panel-1">
      <div className="relative aspect-square">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[4%] rounded-full [background:radial-gradient(closest-side,var(--color-beam-soft),transparent)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-[10%] rounded-full border border-rule bg-panel-2" />

        <div className="absolute inset-[10%]">
          <Shared name={`product-image-${sku}`}>
            {f.ImageUrl ? (
              <Image
                src={f.ImageUrl}
                alt={f.Name}
                fill
                priority
                sizes={SIZES}
                data-fly-src={sku}
                className="object-cover [filter:brightness(0.94)_contrast(1.04)] [mask-image:radial-gradient(closest-side,#000_64%,transparent_98%)]"
              />
            ) : (
              <div data-fly-src={sku} className="grid h-full place-items-center text-glow-4">
                <PackageIcon size={48} strokeWidth={1} aria-hidden />
              </div>
            )}
          </Shared>
        </div>

        <span
          dir="ltr"
          className="num absolute start-5 top-5 rounded-[8px] border border-rule bg-panel-2/90 px-2 py-1 text-[11px] leading-none tracking-[0.06em] text-glow-3 backdrop-blur-sm"
        >
          {sku}
        </span>
      </div>
    </Spotlight>
  );
}
