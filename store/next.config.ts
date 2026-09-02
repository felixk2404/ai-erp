import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // המשגר של הבוט יושב בפינת ה-end התחתונה (שמאל ב-RTL) — בדיוק שם שבו Next
  // מצייר את מחוון הפיתוח שלו, והוא חוסם לחיצות ב-dev (וב-e2e). מזיזים את
  // המחוון לפינה שהחנות משאירה ריקה. dev בלבד; אין לזה השפעה על production.
  devIndicators: { position: 'bottom-right' },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
};

export default nextConfig;
