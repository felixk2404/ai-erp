import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="text-center">
        <div className="text-[12px] font-medium tracking-wide text-ink-3">404</div>
        <h1 className="text-[28px] font-bold mt-1">העמוד לא נמצא</h1>
        <Link href="/" className="inline-block mt-4 text-inkblue hover:text-inkblue-hover">
          חזרה לדשבורד
        </Link>
      </div>
    </main>
  );
}
