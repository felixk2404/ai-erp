import { monthKey } from './format';
import { INVOICE_STATUSES, type Customer, type Invoice, type Lead, type Order, type Task } from './types';

const HEB_MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
const DAY = 24 * 60 * 60 * 1000;

const isValid = (i: Invoice) => i.fields.Status !== 'error';

export type MonthRow = { month: string; label: string; total: number; count: number };

/** הכנסות לפי חודש, N חודשים אחרונים כולל ריקים, מהישן לחדש. */
export function revenueByMonth(invoices: Invoice[], months = 6, now = new Date()): MonthRow[] {
  const rows: MonthRow[] = [];
  const [y0, m0] = monthKey(now.toISOString()).split('-').map(Number);
  for (let k = months - 1; k >= 0; k--) {
    const d = new Date(Date.UTC(y0, m0 - 1 - k, 1));
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    rows.push({ month, label: HEB_MONTHS[d.getUTCMonth()], total: 0, count: 0 });
  }
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  for (const i of invoices.filter(isValid)) {
    const r = byMonth.get(monthKey(i.fields.Created));
    if (!r) continue;
    r.total += i.fields.Total ?? 0;
    r.count += 1;
  }
  return rows;
}

export type StatusRow = { status: string; count: number; total: number };

/** ספירה לפי סטטוס. סטטוס לא מוכר (אופציה שנוספה באיירטייבל) מקבל שורה משלו במקום להיעלם מהגרף. */
export function statusBreakdown(invoices: Invoice[]): StatusRow[] {
  const rows: StatusRow[] = INVOICE_STATUSES.map((status) => ({ status, count: 0, total: 0 }));
  for (const i of invoices) {
    const status = i.fields.Status ?? 'new';
    let r = rows.find((x) => x.status === status);
    if (!r) rows.push((r = { status, count: 0, total: 0 }));
    r.count += 1;
    r.total += i.fields.Total ?? 0;
  }
  return rows;
}

export type Funnel = { stages: { status: 'New' | 'Contacted' | 'Qualified'; count: number }[]; other: Record<string, number>; conversion: number };

/** משפך: New → Contacted → Qualified. conversion = Qualified מתוך כל מי שבמשפך. */
export function leadsFunnel(leads: Lead[]): Funnel {
  const count = { New: 0, Contacted: 0, Qualified: 0 } as Record<'New' | 'Contacted' | 'Qualified', number>;
  const other: Record<string, number> = {};
  for (const l of leads) {
    const s = l.fields.Status ?? 'New';
    if (s in count) count[s as keyof typeof count] += 1;
    else other[s] = (other[s] ?? 0) + 1;
  }
  const inFunnel = count.New + count.Contacted + count.Qualified;
  return {
    stages: (['New', 'Contacted', 'Qualified'] as const).map((status) => ({ status, count: count[status] })),
    other,
    conversion: inFunnel ? Math.round((count.Qualified / inFunnel) * 100) : 0,
  };
}

export type TopCustomer = { customerId: string; name: string; href: string; total: number; count: number };

export function topCustomers(invoices: Invoice[], customers: Customer[], limit = 5): TopCustomer[] {
  const byId = new Map(customers.map((c) => [c.fields.CustomerId, c]));
  const agg = new Map<string, TopCustomer>();
  for (const i of invoices.filter(isValid)) {
    const id = i.fields.CustomerId;
    const c = byId.get(id);
    const row = agg.get(id) ?? { customerId: id, name: c?.fields.Name ?? id, href: c ? `/customers/${c.id}` : '/customers', total: 0, count: 0 };
    row.total += i.fields.Total ?? 0;
    row.count += 1;
    agg.set(id, row);
  }
  return [...agg.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export type AttentionItem = { kind: 'error' | 'overdue' | 'stale-lead' | 'to-ship'; severity: 'red' | 'amber'; title: string; hint?: string; href: string };

const OVERDUE_DAYS = 14;
const STALE_LEAD_DAYS = 7;
const TO_SHIP_HOURS = 24;
const TO_SHIP_STATUSES = new Set<string>(['new', 'confirmed']);

/** סטטוסים שאחריהם המע״מ כבר חושב — חשבונית כזו בלי Total היא כשל שקט בהכנסות. */
const PRICED = new Set<string>(['validated', 'generated', 'paid']);

/** מה דורש פעולה: חשבוניות שגויות, חשבוניות שלא שולמו מעל 14 יום, לידים שנשלח להם מייל ולא ענו מעל 7 ימים,
 *  הזמנות עם משימת שליחה פתוחה מעל 24 שעות,
 *  ורשומות עם נתון חסר — תאריך או סכום — שאחרת פשוט נעלמות מהחישוב ומהפאנל. */
export function attentionItems({
  invoices,
  leads,
  tasks,
  orders = [],
  now = new Date(),
}: {
  invoices: Invoice[];
  leads: Lead[];
  tasks: Task[];
  orders?: Order[];
  now?: Date;
}): AttentionItem[] {
  const items: AttentionItem[] = [];
  const ageDays = (iso: string) => Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
  const ageHours = (iso: string) => (now.getTime() - new Date(iso).getTime()) / (60 * 60 * 1000);
  for (const i of invoices) {
    const age = ageDays(i.fields.Created);
    const num = i.fields.InvoiceNumber ?? 'ללא מספר';
    if (i.fields.Status === 'error') {
      items.push({ kind: 'error', severity: 'red', title: `חשבונית ${num} נכשלה באימות`, hint: i.fields.CustomerId, href: `/invoices/${i.id}` });
    } else if (Number.isNaN(age)) {
      items.push({ kind: 'error', severity: 'amber', title: `לחשבונית ${num} אין תאריך`, hint: 'בלי תאריך היא לא נספרת בהכנסות — השלימו אותו באיירטייבל', href: `/invoices/${i.id}` });
    } else if (i.fields.Status === 'generated' && age >= OVERDUE_DAYS) {
      items.push({ kind: 'overdue', severity: 'amber', title: `${i.fields.InvoiceNumber ?? 'חשבונית'} פתוחה ${age} ימים`, hint: i.fields.Total !== undefined ? `${i.fields.Total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪` : undefined, href: `/invoices/${i.id}` });
    } else if (i.fields.Total === undefined && PRICED.has(i.fields.Status ?? 'new')) {
      items.push({ kind: 'error', severity: 'amber', title: `לחשבונית ${num} אין סכום כולל`, hint: 'המע״מ לא חושב — היא נספרת אבל מוסיפה 0 להכנסות', href: `/invoices/${i.id}` });
    }
  }
  for (const l of leads) {
    if (l.fields.Status !== 'Contacted') continue;
    const age = ageDays(l.fields.Created);
    const name = l.fields.Name ?? 'ללא שם';
    if (Number.isNaN(age)) {
      items.push({ kind: 'stale-lead', severity: 'amber', title: `אין תאריך לליד ${name}`, hint: 'בלי תאריך אי אפשר לדעת כמה זמן הוא ממתין', href: '/leads?status=Contacted' });
    } else if (age >= STALE_LEAD_DAYS) {
      items.push({ kind: 'stale-lead', severity: 'amber', title: `${name} — ללא מענה ${age} ימים`, hint: l.fields.Company, href: '/leads?status=Contacted' });
    }
  }
  // מי שמחליט שהזמנה מחכה למשלוח היא משימת המשלוח שפתח WF10, לא הסטטוס: הזמנת שירות לא מקבלת משימה
  // ולעולם לא נשלחת, וסגירת המשימה מ-/tasks צריכה להשתיק את הפריט גם אם הסטטוס עוד לא עודכן.
  const shipping = new Set(tasks.filter((t) => t.fields.Source === 'order').map((t) => t.fields.RefId));
  for (const o of orders) {
    if (!shipping.has(o.fields.OrderNumber)) continue;
    if (!TO_SHIP_STATUSES.has(o.fields.Status ?? 'new')) continue;
    const hours = ageHours(o.fields.Created);
    if (!(hours >= TO_SHIP_HOURS)) continue;
    items.push({
      kind: 'to-ship',
      severity: 'amber',
      title: `לשלוח ${o.fields.OrderNumber} — ${o.fields.Name}`,
      hint: [o.fields.City, `ממתינה ${Math.floor(hours)} שעות`].filter(Boolean).join(' · '),
      href: `/orders/${o.id}`,
    });
  }
  const rank = { red: 0, amber: 1 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export type Delta = { cur: number; prev: number; pct: number | null };
export type MonthDelta = { total: Delta; count: Delta };

const delta = (cur: number, prev: number): Delta => ({ cur, prev, pct: prev ? Math.round(((cur - prev) / prev) * 100) : null });

/** החודש האחרון מול הקודם (מתוך revenueByMonth). pct=null כשאין בסיס להשוואה. */
export function monthDelta(rows: { total: number; count: number }[]): MonthDelta {
  const cur = rows[rows.length - 1] ?? { total: 0, count: 0 };
  const prev = rows[rows.length - 2] ?? { total: 0, count: 0 };
  return { total: delta(cur.total, prev.total), count: delta(cur.count, prev.count) };
}
