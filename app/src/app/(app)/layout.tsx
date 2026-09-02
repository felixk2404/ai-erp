import { list } from '@/lib/airtable';
import type { InvoiceFields, LeadFields, TaskFields } from '@/lib/types';
import { Sidebar } from '@/components/shell/sidebar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [invoices, leads, tasks] = await Promise.all([
    list<InvoiceFields>('Invoices', { filter: "AND({Status}!='paid', {Status}!='error')" }),
    list<LeadFields>('Leads', { filter: "{Status}='New'" }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
  ]);
  return (
    <div className="flex min-h-dvh">
      <Sidebar counts={{ invoices: invoices.length, leads: leads.length, tasks: tasks.length }} />
      <main className="flex-1 min-w-0 p-8 max-w-[1200px]">{children}</main>
    </div>
  );
}
