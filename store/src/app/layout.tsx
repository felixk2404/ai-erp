import type { Metadata } from 'next';
import { Heebo, JetBrains_Mono } from 'next/font/google';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/components/cart/cart-provider';
import { Header } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import './globals.css';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '800'], variable: '--font-heebo', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'איי.איי אלקטרוניקה', template: '%s · איי.איי אלקטרוניקה' },
  description: 'חנות אלקטרוניקה — מוצרים מקוריים, אחריות יבואן, שירות AI.',
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
          </CartProvider>
        </MotionConfig>
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
