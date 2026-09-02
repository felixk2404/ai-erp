import type { Metadata } from 'next';
import { Heebo, JetBrains_Mono } from 'next/font/google';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '800'], variable: '--font-heebo', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'איי.איי אלקטרוניקה', template: '%s · איי.איי אלקטרוניקה' },
  description: 'חנות אלקטרוניקה — מוצרים מקוריים, אחריות יבואן, שירות AI.',
};

// Header/Footer/CartProvider/SupportWidget נוספים במשימות 3–4, 11.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl" className={`dark ${heebo.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-void text-glow">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
