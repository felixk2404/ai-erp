'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from '@/lib/auth';

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const nextRaw = String(formData.get('next') ?? '/');
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';

  if (password !== env().APP_PASSWORD) return { error: 'סיסמה שגויה' };

  (await cookies()).set(SESSION_COOKIE, await signSession(env().AUTH_SECRET), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(next);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
