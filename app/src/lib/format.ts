const numberFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1180 → "1,180.00 ₪" — סימן השקל אחרי המספר, כמו בחשבונית ישראלית. */
export const ils = (n: number) => `${numberFmt.format(n)} ₪`;

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jerusalem',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** ISO → dd/MM/yyyy לפי שעון ישראל. שדה תאריך שאיירטייבל השמיט מגיע לכאן ריק — ואז "—" ולא קריסה. */
export const dateIL = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
};

const monthFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit' });

/** ISO → "yyyy-MM" לפי שעון ישראל, לקיבוץ לפי חודש. תאריך לא תקין מחזיר '' — הרשומה נשמטת מהקיבוץ במקום להפיל את הדשבורד. */
export const monthKey = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = monthFmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}`;
};
