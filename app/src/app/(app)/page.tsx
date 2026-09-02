/*
  Intent:     בעל החנות, בלילה או בבוקר: "מה נכנס, מה פתוח, מה דורש פעולה, מה המערכת עשתה בלעדיי". חדר בקרה שקט ומדויק.
  Hierarchy:  הכנסות החודש = הגיבור (34/500 mono, זוהר, sparkline + דלתא). אחר כך: תקציר הסוכן, דורש טיפול, בריאות.
              גרפים ב-HUD frame. ואז החיים: פיד חי + מפת מערכת. ואז רשימות.
  Palette:    void / chassis / readout; signal יחיד; LED לסטטוס. גרפים: signal יחיד + פלטת LED לסטטוסים (עם תוויות).
  Motion:     Reveal מדורג לפאנלים (50ms), count-up, stream-text לתקציר, AnimatePresence לפיד, קו אות על הרצועה. הכל < 300ms פר אלמנט.
*/
import Link from 'next/link';
import { Suspense } from 'react';
import { list } from '@/lib/airtable';
import { monthKey, dateIL } from '@/lib/format';
import type { CustomerFields, InvoiceFields, LeadFields, TaskFields } from '@/lib/types';
import { revenueByMonth, statusBreakdown, leadsFunnel, topCustomers, attentionItems, monthDelta } from '@/lib/insights';
import { fetchPulse } from '@/lib/n8n-health';
import { Header } from '@/components/shell/header';
import { LedgerStrip } from '@/components/ledger-strip';
import { Money } from '@/components/money';
import { CountUp } from '@/components/motion/count-up';
import { Reveal } from '@/components/motion/reveal';
import { StatusLed } from '@/components/status-led';
import { EmptyState } from '@/components/empty-state';
import { RevenueBars } from '@/components/charts/revenue-bars';
import { StatusBar } from '@/components/charts/status-bar';
import { LeadsFunnel } from '@/components/charts/funnel';
import { BriefCard, BriefSkeleton } from '@/components/dashboard/brief-card';
import { AttentionList } from '@/components/dashboard/attention-list';
import { HealthStrip } from '@/components/dashboard/health-strip';
import { PulseFeed } from '@/components/dashboard/pulse-feed';
import { SystemMap } from '@/components/dashboard/system-map';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function Panel({ title, sub, href, linkLabel, children, className = '' }: { title: string; sub?: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel p-5 ${className}`}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          {sub && <div className="text-[12px] font-medium tracking-wide text-readout-3">{sub}</div>}
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-sm text-signal hover:text-signal-hover">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function Dashboard() {
  const [invoices, leads, tasks, customers, pulse] = await Promise.all([
    list<InvoiceFields>('Invoices', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<LeadFields>('Leads', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
    list<CustomerFields>('Customers'),
    fetchPulse(),
  ]);

  const now = new Date();
  const thisMonth = monthKey(now.toISOString());
  const valid = invoices.filter((i) => i.fields.Status !== 'error');
  const monthInvoices = valid.filter((i) => monthKey(i.fields.Created) === thisMonth);
  const monthRevenue = monthInvoices.reduce((s, i) => s + (i.fields.Total ?? 0), 0);
  const open = valid.filter((i) => i.fields.Status !== 'paid');
  const openSum = open.reduce((s, i) => s + (i.fields.Total ?? 0), 0);
  const funnel = leadsFunnel(leads);
  const attention = attentionItems({ invoices, leads, tasks, now });
  const nameById = new Map(customers.map((c) => [c.fields.CustomerId, c.fields.Name]));
  const months = revenueByMonth(invoices, 6, now);
  const delta = monthDelta(months);
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });

  return (
    <>
      <Header title="דשבורד" kicker={`CONSOLE · ${timeStr}`} />

      <Reveal index={0}>
        <LedgerStrip
          beams
          items={[
            { label: 'הכנסות החודש', value: <CountUp value={monthRevenue} />, hint: `${monthInvoices.length} חשבוניות`, hero: true, series: months.map((m) => m.total), delta: delta.total },
            { label: 'חשבוניות פתוחות', value: <CountUp value={open.length} kind="int" />, hint: <Money value={openSum} /> },
            { label: 'לידים חדשים', value: <CountUp value={funnel.stages[0].count} kind="int" />, hint: `${funnel.stages[1].count} נשלח מייל · ${funnel.stages[2].count} ענו` },
            { label: 'משימות פתוחות', value: <CountUp value={tasks.length} kind="int" /> },
          ]}
        />
      </Reveal>

      <div className="grid grid-cols-12 gap-5 mt-6">
        <Reveal index={1} className="col-span-12 lg:col-span-5">
          <Suspense fallback={<BriefSkeleton />}>
            <BriefCard />
          </Suspense>
        </Reveal>
        <Reveal index={2} className="col-span-12 md:col-span-7 lg:col-span-4">
          <AttentionList items={attention} />
        </Reveal>
        <Reveal index={3} className="col-span-12 md:col-span-5 lg:col-span-3">
          <HealthStrip health={pulse.health} />
        </Reveal>

        <Reveal index={4} className="col-span-12 lg:col-span-7">
          <Panel title="הכנסות לפי חודש" sub="6 חודשים אחרונים · חשבוניות תקפות" className="hud h-full">
            <RevenueBars data={months} />
          </Panel>
        </Reveal>
        <Reveal index={5} className="col-span-12 lg:col-span-5">
          <div className="grid gap-5 h-full">
            <Panel title="חשבוניות לפי סטטוס" sub="כל הזמנים">
              <StatusBar rows={statusBreakdown(invoices)} />
            </Panel>
            <Panel title="משפך לידים" sub="חדש → נשלח מייל → ענה" href="/leads" linkLabel="כל הלידים">
              <LeadsFunnel data={funnel} />
            </Panel>
          </div>
        </Reveal>

        <Reveal index={6} className="col-span-12 lg:col-span-5">
          <PulseFeed initial={pulse} />
        </Reveal>
        <Reveal index={7} className="col-span-12 lg:col-span-7">
          <SystemMap pulse={pulse} />
        </Reveal>

        <Reveal index={8} className="col-span-12 lg:col-span-7">
          <Panel title="חשבוניות אחרונות" href="/invoices" linkLabel="כל החשבוניות" className="p-0 [&>div]:px-5 [&>div]:pt-5 overflow-hidden">
            {invoices.length === 0 ? (
              <EmptyState illustration="invoices" title="אין חשבוניות עדיין" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-5">מספר</TableHead>
                    <TableHead>לקוח</TableHead>
                    <TableHead className="hidden sm:table-cell">תאריך</TableHead>
                    <TableHead>סה״כ</TableHead>
                    <TableHead className="pe-5">סטטוס</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 6).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="num font-medium ps-5">
                        <Link href={`/invoices/${i.id}`} transitionTypes={['nav-forward']} className="hover:text-signal">
                          {i.fields.InvoiceNumber ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-readout-2">{nameById.get(i.fields.CustomerId) ?? i.fields.CustomerId}</TableCell>
                      <TableCell className="num text-readout-2 hidden sm:table-cell">{dateIL(i.fields.Created)}</TableCell>
                      <TableCell>
                        <Money value={i.fields.Total ?? 0} />
                      </TableCell>
                      <TableCell className="pe-5">
                        <StatusLed table="Invoices" status={i.fields.Status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </Reveal>
        <Reveal index={8} className="col-span-12 lg:col-span-5">
          <Panel title="לקוחות מובילים" sub="לפי הכנסות" href="/customers" linkLabel="כל הלקוחות" className="h-full">
            {(() => {
              const top = topCustomers(invoices, customers, 5);
              const max = Math.max(...top.map((t) => t.total), 1);
              return top.length === 0 ? (
                <p className="text-sm text-readout-3">אין הכנסות עדיין.</p>
              ) : (
                <ol className="space-y-3">
                  {top.map((t, i) => (
                    <li key={t.customerId} className="text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link href={t.href} transitionTypes={['nav-forward']} className="truncate hover:text-signal">
                          <span className="num text-readout-3 me-2">{String(i + 1).padStart(2, '0')}</span>
                          {t.name}
                        </Link>
                        <Money value={t.total} className="font-medium shrink-0" />
                      </div>
                      <div className="mt-1.5 h-1 rounded-full bg-well overflow-hidden">
                        <div className="h-full rounded-full bg-signal/80 shadow-[0_0_8px_var(--signal-glow)]" style={{ width: `${(t.total / max) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              );
            })()}
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
