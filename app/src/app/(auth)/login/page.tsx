import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'כניסה · AI-ERP' };

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
