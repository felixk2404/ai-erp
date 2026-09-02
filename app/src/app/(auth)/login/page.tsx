import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './login-form';
import { Aurora } from '@/components/motion/aurora';

export const metadata: Metadata = { title: 'כניסה · AI-ERP' };

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh grid place-items-center p-6 overflow-hidden">
      <Aurora />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="absolute bottom-5 inset-x-0 text-center mono text-[10px] tracking-[0.2em] text-readout-3">AI-ERP · NIGHT CONSOLE · JOHN BRYCE FINAL PROJECT</p>
    </main>
  );
}
