'use server';

import { cookies } from 'next/headers';
import { erpChat, ErpError } from '@/lib/n8n';

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
  const text = message.trim().slice(0, 2000);
  if (!text) return { error: 'כתוב שאלה' };
  try {
    return { reply: await erpChat(text, await sessionId()) };
  } catch (e) {
    return { error: e instanceof ErpError ? e.message : 'הסוכן לא זמין כרגע' };
  }
}
