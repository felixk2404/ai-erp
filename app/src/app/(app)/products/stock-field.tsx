'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { LED_CLASS } from '@/components/status-led';
import { MAX_STOCK, parseStock, stockLed } from '@/lib/stock';
import { setStock } from './actions';

/**
 * כמות המלאי בתא הטבלה: נורית + שדה מספר שנשמר ביציאה מהשדה או ב-Enter.
 * במנוחה השדה שקוף ובלי מסגרת — עמודת מלאי היא קודם כול קריאה, והמסגרת עולה רק במגע (hover/focus).
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
      } else {
        toast.success('המלאי עודכן');
      }
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`size-2 rounded-full shrink-0 ${LED_CLASS[stockLed(typed.ok ? typed.value : 0, false)]} ${pending ? 'led-live' : ''}`} />
      <Input
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
        className="h-11 w-16 px-1 text-center text-sm num border-transparent bg-transparent hover:border-input hover:bg-well focus:bg-well aria-busy:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </span>
  );
}
