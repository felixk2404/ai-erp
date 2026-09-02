import type { Metadata } from 'next';
import { IBM_Plex_Sans_Hebrew, IBM_Plex_Mono, Heebo } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { MotionProvider } from '@/components/motion/motion-provider';
import { SpotlightProvider } from '@/components/motion/spotlight';
import './globals.css';

const plex = IBM_Plex_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['500', '700', '800'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'AI-ERP · איי.איי אלקטרוניקה',
  description: 'מערכת ניהול חכמה לעסק — חשבוניות, לידים, מוצרים וסוכן AI',
  icons: { icon: '/brand/logo-mark.png' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl" className={`dark ${plex.variable} ${plexMono.variable} ${heebo.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          <SpotlightProvider />
          {children}
        </MotionProvider>
        <Toaster position="bottom-left" richColors theme="dark" />
      </body>
    </html>
  );
}
