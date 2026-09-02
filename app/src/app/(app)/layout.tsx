import { list } from '@/lib/airtable';
import type { InvoiceFields, LeadFields, TaskFields } from '@/lib/types';
import { MobileNav, Sidebar } from '@/components/shell/sidebar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [invoices, leads, tasks] = await Promise.all([
    list<InvoiceFields>('Invoices', { filter: "AND({Status}!='paid', {Status}!='error')" }),
    list<LeadFields>('Leads', { filter: "{Status}='New'" }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
  ]);
  const counts = { invoices: invoices.length, leads: leads.length, tasks: tasks.length };
  return (
    <div className="md:flex min-h-dvh">
      <MobileNav counts={counts} />
      <Sidebar counts={counts} />
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-[1200px]">{children}</main>
    </div>
  );
}
