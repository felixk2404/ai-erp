import Link from 'next/link';
import { list, escapeFormula } from '@/lib/airtable';
import { dateIL } from '@/lib/format';
import { LEAD_STATUSES, type LeadFields } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { leadSourceLabel } from '@/lib/lead-source';
import { Header } from '@/components/shell/header';
import { StatusLed } from '@/components/status-led';
import { EmptyState } from '@/components/empty-state';
import { EntityDialog } from '@/components/forms/entity-dialog';
import { ActionButton } from '@/components/forms/action-button';
import { FieldError } from '@/components/forms/field-error';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLead, runSalesNow } from './actions';
import { LeadStatusSelect } from './status-select';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = '' } = await searchParams;
  const leads = await list<LeadFields>('Leads', {
    filter: status ? `{Status}='${escapeFormula(status)}'` : undefined,
    sort: [{ field: 'Created', direction: 'desc' }],
  });

  return (
    <>
      <Header
        title="לידים"
        actions={
          <>
            <ActionButton action={runSalesNow} pendingText="שולח…" variant="secondary" size="default">
              שלח מייל לליד הבא
            </ActionButton>
            <EntityDialog
              trigger="ליד חדש"
              title="ליד חדש"
              description="הליד ייבדק לכפילויות אוטומטית, וסוכן המכירות ישלח לו מייל ראשון."
              action={createLead}
              successMessage="הליד נוסף"
              submitLabel="הוספה"
            >
              <>
                <div className="space-y-2">
                  <Label htmlFor="lead-name">שם</Label>
                  <Input id="lead-name" name="Name" required autoFocus />
                  <FieldError name="Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-email">אימייל</Label>
                  <Input id="lead-email" name="Email" type="email" dir="ltr" required />
                  <FieldError name="Email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-company">חברה</Label>
                  <Input id="lead-company" name="Company" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-phone">טלפון</Label>
                  <Input id="lead-phone" name="Phone" type="tel" dir="ltr" placeholder="050-1234567" />
                  <FieldError name="Phone" />
                </div>
              </>
            </EntityDialog>
          </>
        }
      />

      <nav aria-label="סינון לפי סטטוס" className="flex flex-wrap gap-1 mb-4">
        <Link
          href="/leads"
          className={`h-8 px-3 inline-flex items-center rounded-md text-sm ${!status ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}
        >
          הכל
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/leads?status=${s}`}
            className={`h-8 px-3 inline-flex items-center rounded-md text-sm ${status === s ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3'}`}
          >
            {statusMeta('Leads', s).label}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-hidden">
        {leads.length === 0 ? (
          <EmptyState title="אין לידים" hint={status ? 'אין לידים בסטטוס הזה' : 'הוסף ליד ראשון'} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>חברה</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>נוצר</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="w-40">שינוי</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.fields.Name}</TableCell>
                  <TableCell className="text-ink-2">{l.fields.Company ?? '—'}</TableCell>
                  <TableCell dir="ltr" className="text-ink-2 text-end">
                    {l.fields.Email ?? '—'}
                  </TableCell>
                  <TableCell dir="ltr" className="num text-ink-2 text-end">
                    {l.fields.Phone ?? '—'}
                  </TableCell>
                  <TableCell className="text-ink-2">
                    {leadSourceLabel(l.fields.Source)}
                    {l.fields.Note && <span className="block text-xs text-ink-3">{l.fields.Note}</span>}
                  </TableCell>
                  <TableCell className="num text-ink-2">{dateIL(l.fields.Created)}</TableCell>
                  <TableCell>
                    <StatusLed table="Leads" status={l.fields.Status} />
                  </TableCell>
                  <TableCell>
                    <LeadStatusSelect id={l.id} status={l.fields.Status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {leads.length > 0 && (
        <p className="text-xs text-ink-3 mt-3">
          סוכן המכירות שולח מייל לליד אחד בסטטוס &quot;חדש&quot; כל 3 שעות. כשהליד עונה, המערכת מזהה את התשובה ומעבירה אותו ל&quot;ענה&quot;.
        </p>
      )}
    </>
  );
}
