/**
 * Rate limiter בזיכרון (sliding window פשוט). ponytail: מספיק ל-instance יחיד ולדמו;
 * ב-scale אמיתי — Upstash/Vercel KV.
 */
export function createRateLimiter({ limit, windowMs, now = () => Date.now() }: { limit: number; windowMs: number; now?: () => number }) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string): boolean {
      const t = now();
      // בלי פינוי, כל IP שביקר פעם אחת נשאר בזיכרון עד סוף חיי ה-instance.
      // סריקה אחת כשהמפה גדלה מעבר לסף (במקום טיימר או TTL לכל מפתח); החותמת
      // האחרונה היא החדשה ביותר, ולכן די בה כדי לדעת שהמפתח כולו פג.
      if (hits.size > 1000) for (const [k, v] of hits) if (t - v[v.length - 1] >= windowMs) hits.delete(k);
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
    /** כמה מפתחות מוחזקים כרגע — לאבחון ולבדיקת הפינוי. */
    size: () => hits.size,
  };
}

/** 20 הודעות לדקה לכל IP בצ'אט הציבורי. */
export const supportLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
