const numberFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1180 → "1,180.00 ₪" — סימן השקל אחרי המספר, כמו בחשבונית ישראלית. */
export const ils = (n: number) => `${numberFmt.format(n)} ₪`;
