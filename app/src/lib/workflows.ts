/**
 * מניפסט 13 ה-workflows של n8n — שמות בעברית ותפקיד, למפת המערכת ולפיד החי.
 * ה-id הוא מזהה ה-workflow במופע ה-n8n (n8n/config.json). לא סוד.
 */
export type WorkflowRole = 'hub' | 'agent' | 'channel' | 'auto' | 'index' | 'guard';
export type WorkflowMeta = { key: string; id: string; name: string; role: WorkflowRole; hint: string };

export const WORKFLOWS: readonly WorkflowMeta[] = [
  { key: 'API', id: 'kn53i73OcuCaz3SZ', name: 'API לאפליקציה', role: 'hub', hint: 'WF13 · webhook מאובטח' },
  { key: 'MANAGER_CORE', id: 'zFz32ARQ3kedlK1f', name: 'סוכן המנהל', role: 'agent', hint: 'WF9b · צ׳אט על הנתונים' },
  { key: 'SUPPORT_CORE', id: 'BEuvek30KqE2zEM7', name: 'סוכן שירות (RAG)', role: 'agent', hint: 'WF5b · מדיניות + מוצרים' },
  { key: 'SALES_COLD_EMAIL', id: 'M7WjpE8Wd20EyOHZ', name: 'סוכן מכירות', role: 'agent', hint: 'WF3 · מייל ראשון כל 3 שעות' },
  { key: 'MANAGER_TELEGRAM', id: 'JnysbcC3wE84Crq5', name: 'טלגרם · מנהל', role: 'channel', hint: 'WF9 · בוט המנהל' },
  { key: 'CUSTOMER_SERVICE', id: 'GGC2TpFYltm7DrWF', name: 'טלגרם · שירות', role: 'channel', hint: 'WF5 · בוט הלקוחות' },
  { key: 'INVOICES_VALIDATE', id: 'ZT0p1wXRsraCrUqA', name: 'אימות חשבוניות', role: 'auto', hint: 'WF1 · מע״מ 18% ומספור' },
  { key: 'INVOICE_PDF', id: 'wNxCRwm0N2F6Z8TS', name: 'הפקת PDF', role: 'auto', hint: 'WF8 · Gotenberg → Drive' },
  { key: 'LEADS_DEDUPE', id: 'sVCp9e8lWnx5kvrV', name: 'סינון כפילויות', role: 'auto', hint: 'WF2 · לידים' },
  { key: 'SALES_REPLIES', id: '5cQhVanCfhxM16ru', name: 'זיהוי תשובות', role: 'auto', hint: 'WF4 · Gmail → Qualified' },
  { key: 'POLICIES_EMBED', id: 'q168BxqKDgaLwbJP', name: 'אינדוקס מדיניות', role: 'index', hint: 'WF6 · pgvector' },
  { key: 'PRODUCTS_EMBED', id: 'Y0XgEK34Zdctslcm', name: 'אינדוקס מוצרים', role: 'index', hint: 'WF7 · pgvector' },
  { key: 'ERROR', id: 'WeWGjptjpf66sA7T', name: 'ניטור שגיאות', role: 'guard', hint: 'WF-Error → טלגרם' },
] as const;

export const ROLE_LABEL: Record<WorkflowRole, string> = {
  hub: 'ליבה',
  agent: 'סוכן AI',
  channel: 'ערוץ',
  auto: 'אוטומציה',
  index: 'אינדוקס',
  guard: 'ניטור',
};

export const workflowById = (id: string) => WORKFLOWS.find((w) => w.id === id);
