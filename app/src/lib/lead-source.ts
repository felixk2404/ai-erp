import type { LeadSource } from './types';

const LABEL: Record<LeadSource, string> = { manual: 'ידני', telegram: 'טלגרם' };

/** מאיפה הגיע הליד. חסר = ידני (לידים שנוצרו לפני השדה). */
export function leadSourceLabel(source?: string): string {
  if (!source) return LABEL.manual;
  return (LABEL as Record<string, string>)[source] ?? source;
}
