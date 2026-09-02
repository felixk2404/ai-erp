/*
  Intent:     בעל החנות, בבוקר עם קפה: "מה נכנס, מה פתוח, מה דורש פעולה, מה המערכת עשתה בלעדיי". פנקס מסודר — חם, שקט, מדויק.
  Hierarchy:  הכנסות החודש = הגיבור (28/600, count-up). מתחת: תקציר AI (הרחב), דורש טיפול, בריאות. ואז גרפים בגוון יחיד, ואז רשימות.
  Palette:    paper / ink / inkblue; LED לסטטוס ולבריאות. גרפים: inkblue יחיד + פלטת LED לסטטוסים (dataviz: אין קטגוריאלי רב-גוני).
  Motion:     Reveal מדורג לפאנלים (50ms), count-up 600ms, שורות התקציר ב-stagger. הכל < 300ms פר אלמנט, transform/opacity בלבד.
*/
import Link from 'next/link';
import { Suspense } from 'react';
import { list } from '@/lib/airtable';
import { monthKey, dateIL } from '@/lib/format';
import type { CustomerFields, InvoiceFields, LeadFields, TaskFields } from '@/lib/types';
import { revenueByMonth, statusBreakdown, leadsFunnel, topCustomers, attentionItems } from '@/lib/insights';
import { fetchHealth } from '@/lib/n8n-health';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function Panel({ title, sub, href, linkLabel, children, className = '' }: { title: string; sub?: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-paper-2 border border-rule rounded-lg p-5 ${className}`}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          {sub && <div className="text-[11px] font-medium tracking-wide text-ink-3">{sub}</div>}
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-sm text-inkblue hover:text-inkblue-hover">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function Dashboard() {
  const [invoices, leads, tasks, customers, health] = await Promise.all([
    list<InvoiceFields>('Invoices', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<LeadFields>('Leads', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
    list<CustomerFields>('Customers'),
    fetchHealth(),
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

  return (
    <>
      <Header title="דשבורד" />

      <Reveal index={0}>
        <LedgerStrip
          items={[
            { label: 'הכנסות החודש', value: <CountUp value={monthRevenue} />, hint: `${monthInvoices.length} חשבוניות`, hero: true },
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
          <HealthStrip health={health} />
        </Reveal>

        <Reveal index={4} className="col-span-12 lg:col-span-7">
          <Panel title="הכנסות לפי חודש" sub="6 חודשים אחרונים · חשבוניות תקפות">
            <RevenueBars data={revenueByMonth(invoices, 6, now)} />
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

        <Reveal index={6} className="col-span-12 lg:col-span-7">
          <Panel title="חשבוניות אחרונות" href="/invoices" linkLabel="כל החשבוניות" className="p-0 [&>div]:px-5 [&>div]:pt-5">
            {invoices.length === 0 ? (
              <EmptyState illustration="invoices" title="אין חשבוניות עדיין" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-5">מספר</TableHead>
                    <TableHead>לקוח</TableHead>
                    <TableHead>תאריך</TableHead>
                    <TableHead>סה״כ</TableHead>
                    <TableHead className="pe-5">סטטוס</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 6).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="num font-medium ps-5">
                        <Link href={`/invoices/${i.id}`} transitionTypes={['nav-forward']} className="hover:text-inkblue">
                          {i.fields.InvoiceNumber ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-ink-2">{nameById.get(i.fields.CustomerId) ?? i.fields.CustomerId}</TableCell>
                      <TableCell className="num text-ink-2">{dateIL(i.fields.Created)}</TableCell>
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
        <Reveal index={7} className="col-span-12 lg:col-span-5">
          <Panel title="לקוחות מובילים" sub="לפי הכנסות" href="/customers" linkLabel="כל הלקוחות">
            {(() => {
              const top = topCustomers(invoices, customers, 5);
              const max = Math.max(...top.map((t) => t.total), 1);
              return top.length === 0 ? (
                <p className="text-sm text-ink-3">אין הכנסות עדיין.</p>
              ) : (
                <ol className="space-y-3">
                  {top.map((t, i) => (
                    <li key={t.customerId} className="text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link href={t.href} transitionTypes={['nav-forward']} className="truncate hover:text-inkblue">
                          <span className="num text-ink-3 me-2">{i + 1}.</span>
                          {t.name}
                        </Link>
                        <Money value={t.total} className="font-medium shrink-0" />
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-paper-3 overflow-hidden">
                        <div className="h-full rounded-full bg-inkblue/70" style={{ width: `${(t.total / max) * 100}%` }} />
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
