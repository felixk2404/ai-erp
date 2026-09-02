/**
 * Aurora — שלושה כתמי אור מטושטשים שנעים לאט (CSS בלבד, בלי WebGL).
 * ציאן של קו האות + כחול עמוק + טורקיז. מעל ה-dot-matrix של הרקע. ממקמים בתוך container עם overflow-hidden.
 */
export function Aurora({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="aurora-blob absolute -top-[20%] -right-[10%] size-[60vmax] rounded-full opacity-40 blur-[110px]" style={{ background: 'radial-gradient(circle, rgba(90,209,255,.55), transparent 62%)', animation: 'aurora-drift 22s ease-in-out infinite' }} />
      <div className="aurora-blob absolute -bottom-[30%] -left-[15%] size-[70vmax] rounded-full opacity-40 blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(43,76,126,.9), transparent 62%)', animation: 'aurora-drift 28s ease-in-out -9s infinite reverse' }} />
      <div className="aurora-blob absolute top-[30%] left-[35%] size-[40vmax] rounded-full opacity-30 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(52,209,122,.35), transparent 62%)', animation: 'aurora-drift 26s ease-in-out -15s infinite' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,9,12,.2), rgba(8,9,12,.75))' }} />
    </div>
  );
}
