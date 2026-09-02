import { describe, expect, it } from 'vitest';
import { cn } from './utils';

/**
 * `text-meta/body/display/hero` הם *גדלים* בסקאלה של system.md, אבל tailwind-merge
 * לא מכיר אותם ולכן סיווג אותם כצבע-טקסט. התוצאה הייתה דו-כיוונית: צבע שנכתב לפני
 * הגודל נמחק (הכפתור הראשי יצא לבן על תכלת, 1.67:1), וגודל שנכתב לפני צבע נמחק
 * (`text-meta` ירד ל-14px). התיקון חי ב-`cn` — נקודת המעבר היחידה של כל הרכיבים.
 */
describe('cn — התנגשות גודל/צבע בסקאלה של החנות', () => {
  it('שומר את צבע הטקסט כשגודל מהסקאלה מגיע אחריו', () => {
    // הכפתור המוביל בקטלוג: BEAM ואז המחלקות המקומיות.
    expect(cn('bg-beam text-void', 'px-4 text-body')).toContain('text-void');
    // הכפתור בעמוד המוצר: variant ברירת מחדל ואז המחלקות המקומיות.
    expect(cn('bg-primary text-primary-foreground', 'h-11 px-4 text-body')).toContain(
      'text-primary-foreground',
    );
  });

  it('שומר את הגודל כשצבע מגיע אחריו', () => {
    expect(cn('text-meta text-glow-3')).toContain('text-meta');
  });

  it('עדיין מכריע התנגשות אמיתית בין שני גדלים', () => {
    expect(cn('text-body', 'text-lg')).toBe('text-lg');
    expect(cn('text-lg', 'text-display')).toBe('text-display');
  });

  it('עדיין מכריע התנגשות אמיתית בין שני צבעים', () => {
    expect(cn('text-glow', 'text-void')).toBe('text-void');
  });
});
