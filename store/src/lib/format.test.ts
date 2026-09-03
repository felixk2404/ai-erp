import { describe, expect, it } from 'vitest';
import { ils, modelName, nbspShekel } from './format';

describe('format', () => {
  it('מעצב שקלים עם הסימן אחרי המספר', () => {
    expect(ils(1180)).toBe('1,180.00\u00A0₪');
  });

  it('מונע שבירת שורה באמצע שם דגם לטיני', () => {
    expect(modelName("מסך 27 אינץ' TY-Vision QHD 165Hz")).toBe(
      "מסך 27 אינץ' TY-\u2060Vision QHD 165Hz",
    );
    expect(modelName('TY-HP-200')).toBe('TY-\u2060HP-\u2060200');
  });

  it('לא נוגע במקף שאינו בתוך אסימון לטיני', () => {
    expect(modelName('אוזניות על-אוזן')).toBe('אוזניות על-אוזן');
    expect(modelName('1–3 ימי עסקים')).toBe('1–3 ימי עסקים');
    expect(modelName('טווח 10 - 20')).toBe('טווח 10 - 20');
  });

  it('הופך רווח רגיל לפני ₪ לרווח קשיח בטקסט חופשי', () => {
    expect(nbspShekel('חינם בהזמנה מעל 300 ₪.')).toBe('חינם בהזמנה מעל 300\u00A0₪.');
    expect(nbspShekel('מחיר: 690 ₪ לחודש, מינימום 3 חודשים.')).toBe('מחיר: 690\u00A0₪ לחודש, מינימום 3 חודשים.');
  });

  it('לא נוגע בטקסט שכבר תקין או בלי ₪', () => {
    expect(nbspShekel('החל מ-149\u00A0₪')).toBe('החל מ-149\u00A0₪');
    expect(nbspShekel('אחריות יבואן רשמי')).toBe('אחריות יבואן רשמי');
  });
});
