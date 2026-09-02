"use client";

import { Button } from "@/components/ui/button";

/**
 * מפעיל את פאנל הבוט (משימה 11 מאזינה ל-CustomEvent הזה) בלי תלות ישירה ברכיב שלו —
 * כל עמוד יכול לבקש עזרה מהבוט בלחיצה אחת.
 */
export function AskBotButton() {
  return (
    <Button
      type="button"
      size="lg"
      onClick={() => window.dispatchEvent(new CustomEvent("aie:support"))}
    >
      לא מצאתם תשובה? שאלו את הבוט
    </Button>
  );
}
