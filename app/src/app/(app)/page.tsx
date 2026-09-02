/*
  Intent:     בעל החנות, בבוקר עם קפה: "מה נכנס, מה פתוח, מה דורש פעולה". תחושה: פנקס מסודר — חם, שקט, מדויק.
  Hierarchy:  הכנסות החודש = הגיבור (28/600). כל השאר 14–18px, הבדל דרך weight + opacity.
  Palette:    paper / ink / inkblue; LED רק לסטטוס. Depth: borders-only. Surfaces: paper → paper-2 → paper-3.
  Typography: Plex Sans Hebrew 14 (11/14/18/22/28), Frank Ruhl Libre לכותרות. Spacing: 8px, workbench (12/16, שורה 40px).
*/
import Link from 'next/link';
import { list } from '@/lib/airtable';
import { monthKey, dateIL } from '@/lib/format';
import type { InvoiceFields, LeadFields, TaskFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { LedgerStrip } from '@/components/ledger-strip';
import { Money } from '@/components/money';
import { StatusLed } from '@/components/status-led';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="text-sm text-inkblue hover:text-inkblue-hover">
          {linkLabel}
        </Link>
      </div>
      <div className="bg-paper-2 border border-rule rounded-lg overflow-hidden">{children}</div>
    </section>
  );
}

export default async function Dashboard() {
  const [invoices, leads, tasks] = await Promise.all([
    list<InvoiceFields>('Invoices', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<LeadFields>('Leads', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
  ]);

  const thisMonth = monthKey(new Date().toISOString());
  const valid = invoices.filter((i) => i.fields.Status !== 'error');
  const monthInvoices = valid.filter((i) => monthKey(i.fields.Created) === thisMonth);
  const monthRevenue = monthInvoices.reduce((s, i) => s + (i.fields.Total ?? 0), 0);
  const open = valid.filter((i) => i.fields.Status !== 'paid');
  const openSum = open.reduce((s, i) => s + (i.fields.Total ?? 0), 0);
  const leadCounts = leads.reduce<Record<string, number>>((m, l) => {
    const k = l.fields.Status ?? 'New';
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});

  return (
    <>
      <Header title="דשבורד" />
      <LedgerStrip
        items={[
          { label: 'הכנסות החודש', value: <Money value={monthRevenue} />, hint: `${monthInvoices.length} חשבוניות`, hero: true },
          { label: 'חשבוניות פתוחות', value: open.length, hint: <Money value={openSum} /> },
          {
            label: 'לידים חדשים',
            value: leadCounts.New ?? 0,
            hint: `${leadCounts.Contacted ?? 0} נשלח מייל · ${leadCounts.Qualified ?? 0} ענו`,
          },
          { label: 'משימות פתוחות', value: tasks.length },
        ]}
      />

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Panel title="חשבוניות אחרונות" href="/invoices" linkLabel="כל החשבוניות">
          {invoices.length === 0 ? (
            <EmptyState title="אין חשבוניות עדיין" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>סה״כ</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.slice(0, 6).map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="num font-medium">{i.fields.InvoiceNumber ?? '—'}</TableCell>
                    <TableCell className="num text-ink-2">{i.fields.CustomerId}</TableCell>
                    <TableCell>
                      <Money value={i.fields.Total ?? 0} />
                    </TableCell>
                    <TableCell>
                      <StatusLed table="Invoices" status={i.fields.Status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel title="לידים אחרונים" href="/leads" linkLabel="כל הלידים">
          {leads.length === 0 ? (
            <EmptyState title="אין לידים עדיין" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>חברה</TableHead>
                  <TableHead>נוצר</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 6).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.fields.Name}</TableCell>
                    <TableCell className="text-ink-2">{l.fields.Company ?? '—'}</TableCell>
                    <TableCell className="num text-ink-2">{dateIL(l.fields.Created)}</TableCell>
                    <TableCell>
                      <StatusLed table="Leads" status={l.fields.Status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
