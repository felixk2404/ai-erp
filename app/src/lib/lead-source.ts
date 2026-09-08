import type { LeadSource } from './types';

const LABEL: Record<LeadSource, string> = { manual: 'ידני', telegram: 'טלגרם', web: 'אתר' };

/** מאיפה הגיע הליד. חסר = ידני (לידים שנוצרו לפני השדה). */
export function leadSourceLabel(source?: string): string {
  if (!source) return LABEL.manual;
  // hasOwn ולא גישה ישירה: מקור בשם "toString" מחזיר פונקציה מה-prototype במקום ליפול ל-source
  return Object.hasOwn(LABEL, source) ? (LABEL as Record<string, string>)[source] : source;
}
