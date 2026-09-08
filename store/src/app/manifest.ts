import type { MetadataRoute } from 'next';

/**
 * מוגש כ-`/manifest.webmanifest`; Next מוסיף את תגית ה-link לבד.
 * בלי service worker בכוונה: החנות קוראת קטלוג חי ומזמינה דרך n8n,
 * ומטמון offline היה מגיש מחירים ומלאי ישנים — גרוע יותר מדף שלא נטען.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'איי.איי אלקטרוניקה',
    short_name: 'איי.איי',
    description: 'מוצרים מקוריים עם אחריות יבואן רשמי. משלוח 29 ₪, חינם מעל 300 ₪.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090c',
    theme_color: '#07090c',
    lang: 'he',
    dir: 'rtl',
    categories: ['shopping'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
