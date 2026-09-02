import { describe, expect, it } from 'vitest';
import { ils } from './format';

describe('format', () => {
  it('מעצב שקלים עם הסימן אחרי המספר', () => {
    expect(ils(1180)).toBe('1,180.00 ₪');
  });
});
