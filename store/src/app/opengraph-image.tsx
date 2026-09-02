import { ImageResponse } from 'next/og';

export const alt = 'איי.איי אלקטרוניקה — טכנולוגיה שרואים.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * כרטיס השיתוף הוא אותו חדר תצוגה בפריים אחד: רקע void, הילת beam יחידה מאחורי
 * הסימן, ומתחתיה החתימה והסלוגן. בלי צילום מוצר — התמונה חייבת להישאר נכונה
 * גם כשהקטלוג משתנה.
 *
 * satori לא נושא פונט עברי משלו, ולכן Heebo נמשך מ-Google בזמן הבנייה. אם אין
 * רשת — נופלים לפונט ברירת המחדל במקום להפיל את ה-build.
 */
async function heebo(weight: 400 | 800) {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Heebo:wght@${weight}`).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: 'Heebo', data, weight, style: 'normal' as const };
  } catch {
    return null;
  }
}

export default async function Image() {
  const fonts = (await Promise.all([heebo(400), heebo(800)])).filter((f) => f !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          background: '#07090c',
          backgroundImage: 'radial-gradient(900px circle at 50% 28%, rgba(92,200,255,0.16), transparent 70%)',
          fontFamily: 'Heebo',
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32">
          <circle cx="16" cy="7" r="4.5" fill="#5cc8ff" opacity="0.18" />
          <circle cx="16" cy="7" r="2" fill="#5cc8ff" />
          <path d="M8.5 25 16 12.5 23.5 25" fill="none" stroke="#eef2f6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* row-reverse: satori פורס בסדר LTR, וכאן המילה הראשונה בעברית צריכה לשבת מימין. */}
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 14, fontSize: 68, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#eef2f6' }}>איי.איי</span>
          <span style={{ color: '#aab4c0' }}>אלקטרוניקה</span>
        </div>

        <div style={{ fontSize: 30, color: '#6f7a88' }}>טכנולוגיה שרואים.</div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
