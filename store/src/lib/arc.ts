export type Point = { x: number; y: number };
export type ArcSample = { x: number; y: number; rotate: number };
export type ArcOptions = {
  /** גובה הקשת ביחס לאורך הקו הישר. 0 = קו ישר. */
  strength?: number;
  /** כמה מוקדם על הקו יושבת נקודת הבקרה (0–1). קטן = הקשת "יוצאת" מהר. */
  peak?: number;
  /** לאיזה צד הקשת מתעקלת. */
  direction?: 'cw' | 'ccw';
};

/** בזייה ריבועית על ציר יחיד. */
export function quadratic(t: number, p0: number, p1: number, p2: number): number {
  const r = 1 - t;
  return r * r * p0 + 2 * r * t * p1 + t * t * p2;
}

/**
 * נקודת הבקרה: peak לאורך הקו מ-(x0,y0) ל-(x1,y1), ועוד strength×אורך במאונך אליו.
 * אם שתי הנקודות זהות אין כיוון מאונך — מחזירים את נקודת המוצא.
 */
export function controlPoint(x0: number, y0: number, x1: number, y1: number, strength: number, peak: number): Point {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: x0, y: y0 };
  return { x: x0 + dx * peak + (-dy / len) * strength * len, y: y0 + dy * peak + (dx / len) * strength * len };
}

/**
 * מסלול הטיסה של הפריט אל העגלה: קשת בזייה ריבועית מ-from ל-to.
 * מחזיר דוגם טהור — `path(t)` נותן מיקום וזווית משיק (מעלות) לכל 0 ≤ t ≤ 1,
 * כך שהאנימציה עצמה נשארת רק onUpdate והלוגיקה ניתנת לבדיקה בלי DOM.
 */
export function createArcPath(from: Point, to: Point, { strength = 0.5, peak = 0.15, direction = 'cw' }: ArcOptions = {}) {
  const signed = direction === 'cw' ? -strength : strength;
  const c = controlPoint(from.x, from.y, to.x, to.y, signed, peak);
  return (t: number): ArcSample => {
    const dx = 2 * (1 - t) * (c.x - from.x) + 2 * t * (to.x - c.x);
    const dy = 2 * (1 - t) * (c.y - from.y) + 2 * t * (to.y - c.y);
    return {
      x: quadratic(t, from.x, c.x, to.x),
      y: quadratic(t, from.y, c.y, to.y),
      rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
    };
  };
}
