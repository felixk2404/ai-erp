// ללא server-only: proxy.ts (edge-compatible) משתמש בקובץ הזה. Web Crypto בלבד.
const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const SESSION_COOKIE = 'erp_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/** "<exp>.<hmac>" — exp בשניות, חתום עם AUTH_SECRET. */
export async function signSession(secret: string, ttlSeconds = SESSION_TTL_SECONDS): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${await hmacHex(secret, String(exp))}`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split('.');
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || !sig || exp < Date.now() / 1000) return false;
  const expected = await hmacHex(secret, expStr);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
