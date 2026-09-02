import type { Metadata } from 'next';
import { Heebo, JetBrains_Mono } from 'next/font/google';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/components/cart/cart-provider';
import { CartSheet } from '@/components/cart/cart-sheet';
import { FlyToCart } from '@/components/cart/fly-to-cart';
import { Header } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import { SupportWidget } from '@/components/support/support-widget';
import './globals.css';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '800'], variable: '--font-heebo', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

// metadataBase נדרש כדי ש-opengraph-image וכל URL יחסי אחר ייצאו מוחלטים.
// ברירת מחדל מקומית כדי ש-build ללא סביבה לא ייפול — אבל בפרודקשן זו כתובת שגויה
// בכל תגית שיתוף, ולכן היא צועקת בלוג הבנייה במקום להישלח בשקט.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl && process.env.NODE_ENV === 'production') {
  console.warn('[store] NEXT_PUBLIC_SITE_URL חסר — metadataBase נופל ל-localhost:3200 וכל og:image יצא שבור.');
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl ?? 'http://localhost:3200'),
  title: { default: 'איי.איי אלקטרוניקה', template: '%s · איי.איי אלקטרוניקה' },
  description: 'מוצרים מקוריים עם אחריות יבואן רשמי. משלוח 29 ₪, חינם מעל 300 ₪.',
};

// מגירת העגלה (משימה 8) והבוט (משימה 11) נתלים בתוך CartProvider.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl" className={`dark ${heebo.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-void text-glow">
        <MotionConfig reducedMotion="user">
          <CartProvider>
            <Header />
            <main className="container-x min-h-[70dvh] py-8">{children}</main>
            <Footer />
            <CartSheet />
            <FlyToCart />
            <SupportWidget />
          </CartProvider>
        </MotionConfig>
        <Toaster position="bottom-center" theme="dark" style={{ zIndex: 'var(--z-toast)' }} />
      </body>
    </html>
  );
}
