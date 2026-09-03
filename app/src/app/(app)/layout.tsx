import { list } from '@/lib/airtable';
import { ils } from '@/lib/format';
import type { CustomerFields, InvoiceFields, LeadFields, OrderFields, ProductFields, TaskFields } from '@/lib/types';
import { MobileNav, Sidebar } from '@/components/shell/sidebar';
import { CommandMenu, type CommandItem } from '@/components/command-menu';
import { SupportWidget } from '@/components/chat/support-widget';
import { Hotkeys } from '@/components/shell/hotkeys';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [invoices, leads, openOrders, tasks, customers, products] = await Promise.all([
    list<InvoiceFields>('Invoices', { sort: [{ field: 'Created', direction: 'desc' }] }),
    list<LeadFields>('Leads', { filter: "{Status}='New'" }),
    // הזמנה שעדיין לא נשלחה = משהו שמחכה למנהל; נשלחה/נמסרה/בוטלה כבר לא.
    // סטטוס ריק נספר גם הוא — statusMeta קורא אותו כ'new', ובלי זה ההזמנה נעלמת מהמונה.
    list<OrderFields>('Orders', { filter: "OR({Status}='new',{Status}='confirmed',{Status}='')" }),
    list<TaskFields>('Tasks', { filter: "{Status}!='done'" }),
    list<CustomerFields>('Customers', { sort: [{ field: 'Name' }] }),
    list<ProductFields>('Products', { sort: [{ field: 'Name' }] }),
  ]);
  const openInvoices = invoices.filter((i) => i.fields.Status !== 'paid' && i.fields.Status !== 'error');
  const counts = { orders: openOrders.length, invoices: openInvoices.length, leads: leads.length, tasks: tasks.length };

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
      {/* 2.4.1 — לפני <main> יושבים המותג, ⌘K, 7 קישורי ניווט, שירות, יציאה. זה המעקף. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-100 focus:rounded-md focus:bg-chassis-3 focus:px-4 focus:py-2 focus:text-readout focus:outline-2 focus:outline-signal"
      >
        דילוג לתוכן
      </a>
      <MobileNav counts={counts} />
      <Sidebar counts={counts} />
      <main id="main" tabIndex={-1} className="flex-1 min-w-0 p-4 md:p-8 max-w-[1200px] outline-none">
        {children}
      </main>
      <CommandMenu items={items} />
      <SupportWidget />
      <Hotkeys />
    </div>
  );
}
