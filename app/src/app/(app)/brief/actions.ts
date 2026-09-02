'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import { erpChat, ErpError } from '@/lib/n8n';

const PROMPT =
  'תן לבעל העסק תקציר בוקר קצר: 3 עד 5 שורות, כל שורה משפט אחד. מה ההכנסות החודש, כמה חשבוניות פתוחות, מה מצב הלידים, ומה הדבר האחד שכדאי לעשות היום. בלי פתיחים, בלי אימוג׳י, בלי כותרות.';

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

const cachedBrief = unstable_cache(
  async (day: string) => {
    try {
      return { text: await erpChat(PROMPT, `brief-${day}`), at: new Date().toISOString() };
    } catch (e) {
      return { text: '', error: e instanceof ErpError ? e.message : 'הסוכן לא זמין כרגע', at: new Date().toISOString() };
    }
  },
  ['daily-brief'],
  { revalidate: 60 * 60 * 6, tags: ['daily-brief'] },
);

export type Brief = { text: string; error?: string; at: string };

export async function getDailyBrief(): Promise<Brief> {
  return cachedBrief(todayKey());
}

export async function refreshBrief(): Promise<{ ok: true }> {
  revalidateTag('daily-brief', 'max');
  return { ok: true };
}
