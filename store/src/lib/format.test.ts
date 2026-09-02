import { describe, expect, it } from 'vitest';
import { dateIL, ils } from './format';

describe('format', () => {
  it('מעצב שקלים עם הסימן אחרי המספר', () => {
    expect(ils(1180)).toBe('1,180.00 ₪');
  });

  it('מעצב תאריך ישראלי', () => {
    expect(dateIL('2026-09-02T10:00:00.000Z')).toBe('02/09/2026');
  });
});
