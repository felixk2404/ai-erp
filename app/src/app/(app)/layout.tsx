import { list } from '@/lib/airtable';
import { ils } from '@/lib/format';
import type { CustomerFields, InvoiceFields, LeadFields, ProductFields, TaskFields } from '@/lib/types';
import { MobileNav, Sidebar } from '@/components/shell/sidebar';
import { CommandMenu, type CommandItem } from '@/components/command-menu';
import { SupportWidget } from '@/components/chat/support-widget';
import { Hotkeys } from '@/components/shell/hotkeys';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [invoices, leads, tasks, customers, products] = await Promise.all([
    list<InvoiceFields>('Invoices', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<LeadFields>('Leads', { filter: "{Status}='New'" }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
    list<CustomerFields>('Customers', { sort: [{ field: 'Name' }] }),
    list<ProductFields>('Products', { sort: [{ field: 'Name' }] }),
  ]);
  const openInvoices = invoices.filter((i) => i.fields.Status !== 'paid' && i.fields.Status !== 'error');
  const counts = { invoices: openInvoices.length, leads: leads.length, tasks: tasks.length };

  const items: CommandItem[] = [
    ...customers.map((c) => ({ label: c.fields.Name, hint: c.fields.CustomerId, href: `/customers/${c.id}`, group: 'לקוחות' as const })),
    ...invoices
      .filter((i) => i.fields.InvoiceNumber)
      .slice(0, 100)
      .map((i) => ({ label: `${i.fields.InvoiceNumber} · ${i.fields.CustomerId}`, hint: i.fields.Total ? ils(i.fields.Total) : undefined, href: `/invoices/${i.id}`, group: 'חשבוניות' as const })),
    ...products.map((p) => ({ label: p.fields.Name, hint: p.fields.Sku, href: `/products?q=${encodeURIComponent(p.fields.Sku ?? p.fields.Name)}`, group: 'מוצרים' as const })),
  ];

  return (
    <div className="md:flex min-h-dvh">
      <MobileNav counts={counts} />
      <Sidebar counts={counts} />
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-[1200px]">{children}</main>
      <CommandMenu items={items} />
      <SupportWidget />
      <Hotkeys />
    </div>
  );
}
