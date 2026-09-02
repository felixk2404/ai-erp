import type { Metadata } from 'next';
import { IBM_Plex_Sans_Hebrew, Frank_Ruhl_Libre } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { MotionProvider } from '@/components/motion/motion-provider';
import './globals.css';

const plex = IBM_Plex_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
});

const frank = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['500', '700'],
  variable: '--font-frank',
});

export const metadata: Metadata = {
  title: 'AI-ERP · איי.איי אלקטרוניקה',
  description: 'מערכת ניהול חכמה לעסק — חשבוניות, לידים, מוצרים וסוכן AI',
  icons: { icon: '/brand/logo.png' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl" className={`${plex.variable} ${frank.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
