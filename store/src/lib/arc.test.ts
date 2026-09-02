import { describe, expect, it } from 'vitest';
import { controlPoint, createArcPath, quadratic } from './arc';

const FROM = { x: 100, y: 500 };
const TO = { x: 1200, y: 40 };

describe('quadratic', () => {
  it('מחזיר את הקצוות ב-t=0 ו-t=1', () => {
    expect(quadratic(0, 3, 17, 9)).toBe(3);
    expect(quadratic(1, 3, 17, 9)).toBe(9);
  });
});

describe('controlPoint', () => {
  it('מחזיר את נקודת המוצא כששתי הנקודות זהות', () => {
    expect(controlPoint(5, 5, 5, 5, 0.5, 0.15)).toEqual({ x: 5, y: 5 });
  });

  it('מזיז את נקודת הבקרה מהקו הישר כש-strength ≠ 0', () => {
    const c = controlPoint(0, 0, 100, 0, 0.5, 0.5);
    expect(c.x).toBeCloseTo(50);
    expect(c.y).toBeCloseTo(50);
  });
});

describe('createArcPath', () => {
  const path = createArcPath(FROM, TO);

  it('מתחיל ב-from ומסיים ב-to', () => {
    expect(path(0).x).toBeCloseTo(FROM.x);
    expect(path(0).y).toBeCloseTo(FROM.y);
    expect(path(1).x).toBeCloseTo(TO.x);
    expect(path(1).y).toBeCloseTo(TO.y);
  });

  it('אמצע הקשת סוטה מהקו הישר', () => {
    const mid = path(0.5);
    const straight = { x: (FROM.x + TO.x) / 2, y: (FROM.y + TO.y) / 2 };
    expect(Math.hypot(mid.x - straight.x, mid.y - straight.y)).toBeGreaterThan(50);
  });

  it('cw ו-ccw מתעקלים לצדדים מנוגדים', () => {
    const cw = createArcPath(FROM, TO, { direction: 'cw' })(0.5);
    const ccw = createArcPath(FROM, TO, { direction: 'ccw' })(0.5);
    const straightY = (FROM.y + TO.y) / 2;
    expect(Math.sign(cw.y - straightY)).toBe(-Math.sign(ccw.y - straightY));
  });

  it('strength=0 נותן קו ישר', () => {
    const mid = createArcPath(FROM, TO, { strength: 0, peak: 0.5 })(0.5);
    expect(mid.x).toBeCloseTo((FROM.x + TO.x) / 2);
    expect(mid.y).toBeCloseTo((FROM.y + TO.y) / 2);
  });

  it('זווית המשיק סופית לכל אורך המסלול, גם כשהמוצא והיעד זהים', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) expect(Number.isFinite(path(t).rotate)).toBe(true);
    const degenerate = createArcPath(FROM, FROM);
    expect(Number.isFinite(degenerate(0.5).rotate)).toBe(true);
  });
});
