/**
 * כותרת שנכנסת מילה-מילה (stagger 50ms) — הכרזה, לא קישוט. משמשת פעם אחת בעמוד.
 * הטקסט המלא נשאר לקורא מסך דרך aria-label; המילים עצמן aria-hidden.
 *
 * CSS ולא motion, ובכוונה: זו הכותרת הראשית, כלומר מועמדת ה-LCP של דף הבית.
 * אנימציית JS מתחילה רק אחרי הידרציה, ולכן הכותרת נשארה בלתי-נראית ~3 שניות
 * במכשיר איטי (LCP 5.7s נמדד). @keyframes מתחיל בציור הראשון, בלי JS בכלל —
 * וגם prefers-reduced-motion מטופל נטיבית ב-globals.css.
 */
export function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span aria-label={text} className={`inline-block ${className}`}>
      {text.split(' ').map((w, i) => (
        <span key={`${w}-${i}`} data-word-reveal aria-hidden className="me-[0.25em] inline-block">
          {w}
        </span>
      ))}
    </span>
  );
}
