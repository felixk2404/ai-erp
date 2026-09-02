'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import { erpChat, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';

const PROMPT =
  'תן לבעל העסק תקציר בוקר קצר: 3 עד 5 שורות, כל שורה משפט אחד. מה ההכנסות החודש, כמה חשבוניות פתוחות, מה מצב הלידים, ומה הדבר האחד שכדאי לעשות היום. בלי פתיחים, בלי אימוג׳י, בלי כותרות.';

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

const cachedBrief = unstable_cache(
  async (day: string) => ({ text: await erpChat(PROMPT, `brief-${day}`), at: new Date().toISOString() }),
  ['daily-brief'],
  { revalidate: 60 * 60 * 6, tags: ['daily-brief'] },
);

export type Brief = { text: string; error?: string; at: string };

/** התפיסה נמצאת מחוץ ל-cache בכוונה: תקלה של 30 שניות ב-08:00 לא תיתקע כתקציר היום עד 14:00. */
export async function getDailyBrief(): Promise<Brief> {
  try {
    return await cachedBrief(todayKey());
  } catch (e) {
    logError('brief', e);
    return { text: '', error: e instanceof ErpError ? e.message : 'הסוכן לא זמין כרגע', at: new Date().toISOString() };
  }
}

export async function refreshBrief(): Promise<{ ok: true }> {
  revalidateTag('daily-brief', 'max');
  return { ok: true };
}
