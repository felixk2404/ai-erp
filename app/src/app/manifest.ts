import type { MetadataRoute } from 'next';

/**
 * מוגש כ-`/manifest.webmanifest`; Next מוסיף את תגית ה-link לבד.
 * בלי service worker בכוונה: זו מערכת ניהול שכל מסך בה נקרא חי מ-Airtable,
 * ומטמון offline היה מציג מלאי, חשבוניות וסטטוסים ישנים כאילו הם הנתון הנוכחי.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI-ERP · איי.איי אלקטרוניקה',
    short_name: 'AI-ERP',
    description: 'מערכת ניהול חכמה לעסק — חשבוניות, לידים, מוצרים וסוכן AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1017',
    theme_color: '#0d1017',
    lang: 'he',
    dir: 'rtl',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
