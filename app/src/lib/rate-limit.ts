/**
 * Rate limiter בזיכרון (sliding window פשוט). ponytail: מספיק ל-instance יחיד ולדמו;
 * ב-scale אמיתי — Upstash/Vercel KV.
 */
export function createRateLimiter({ limit, windowMs, now = () => Date.now() }: { limit: number; windowMs: number; now?: () => number }) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
  };
}

/** 20 הודעות לדקה לכל IP בצ'אט הציבורי. */
export const supportLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
