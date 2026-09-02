import { describe, it, expect } from 'vitest';
import { splitSentences } from './support-text';

describe('splitSentences', () => {
  it('splits on sentence enders and newlines, trimming each chunk', () => {
    expect(splitSentences('כן, TY-HP-200 נמצא במלאי. המחיר הוא 349 ₪ כולל מע"מ.')).toEqual([
      'כן, TY-HP-200 נמצא במלאי.',
      'המחיר הוא 349 ₪ כולל מע"מ.',
    ]);
    expect(splitSentences('שורה ראשונה\n\nשורה שנייה')).toEqual(['שורה ראשונה', 'שורה שנייה']);
  });

  it('keeps decimals and models intact, and handles empty input', () => {
    expect(splitSentences('הסוללה היא 1.5 ליטר ודגם TY-200 זמין')).toEqual(['הסוללה היא 1.5 ליטר ודגם TY-200 זמין']);
    expect(splitSentences('   ')).toEqual([]);
  });
});
