'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { LED_CLASS } from '@/components/status-led';
import { MAX_STOCK, parseStock, stockLed } from '@/lib/stock';
import { setStock } from './actions';

/**
 * כמות המלאי בתא הטבלה: נורית + שדה מספר שנשמר ביציאה מהשדה או ב-Enter.
 * הנורית נגזרת ממה שמוקלד ולא מהערך השמור, כך שהצבע מגיב לפני הכתיבה לשרת.
 * כישלון מחזיר את השדה לערך השמור — שדה שנשאר עם מספר שלא נשמר הוא שקר.
 */
export function StockField({ id, name, stock }: { id: string; name: string; stock?: number }) {
  const saved = String(stock ?? 0);
  const [value, setValue] = useState(saved);
  const [pending, start] = useTransition();
  const typed = parseStock(value);

  const save = () => {
    if (pending || value === saved) return;
    start(async () => {
      const r = await setStock(id, value);
      if (r.error) {
        toast.error(r.error);
        setValue(saved);
      }
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`size-2 rounded-full shrink-0 ${LED_CLASS[stockLed(typed.ok ? typed.value : 0, false)]}`} />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_STOCK}
        step={1}
        dir="ltr"
        value={value}
        aria-label={`מלאי — ${name}`}
        aria-busy={pending}
        // הקלדה בזמן שמירה הייתה נבלעת (ה-guard ב-save מפיל אותה) — עדיף שדה נעול מהקלדה שנעלמת
        readOnly={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setValue(saved);
        }}
        className="h-11 w-16 rounded-lg border border-input bg-well px-2 text-center text-sm num text-ink outline-none transition-colors focus-visible:border-signal focus-visible:ring-3 focus-visible:ring-signal/25 aria-busy:opacity-60"
      />
    </span>
  );
}
