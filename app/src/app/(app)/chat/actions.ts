'use server';

import { cookies } from 'next/headers';
import { erpChat, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';

const CHAT_COOKIE = 'erp_chat';

async function sessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CHAT_COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(CHAT_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return id;
}

export type ChatResult = { reply?: string; error?: string };

export async function sendChat(message: string): Promise<ChatResult> {
  const text = message.trim();
  if (!text) return { error: 'כתוב שאלה' };
  // חיתוך שקט שלח לסוכן חצי שאלה והוא ענה על משהו אחר
  if (text.length > 2000) return { error: 'ההודעה ארוכה מדי. קצרו אותה ונסו שוב.' };
  try {
    return { reply: await erpChat(text, await sessionId()) };
  } catch (e) {
    logError('chat', e);
    return { error: e instanceof ErpError ? e.message : 'הסוכן לא זמין כרגע' };
  }
}
