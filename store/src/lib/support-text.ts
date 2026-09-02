/**
 * מפצל תשובה של הסוכן למשפטים, כדי לחשוף אותם בהדרגה ("מראה של הקלדה").
 * הפיצול הוא אחרי סימן סוף-משפט שאחריו רווח, או בשורה חדשה — כך ש-"1.5 ליטר"
 * או "TY-200" לא נשברים באמצע.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
