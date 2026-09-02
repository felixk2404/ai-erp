const numberFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1180 → "1,180.00 ₪" — סימן השקל אחרי המספר, כמו בחשבונית ישראלית. */
export const ils = (n: number) => `${numberFmt.format(n)} ₪`;

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jerusalem',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** ISO → dd/MM/yyyy לפי שעון ישראל. */
export const dateIL = (iso: string) => dateFmt.format(new Date(iso));

const monthFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit' });

/** ISO → "yyyy-MM" לפי שעון ישראל, לקיבוץ לפי חודש. */
export const monthKey = (iso: string) => {
  const parts = monthFmt.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}`;
};
