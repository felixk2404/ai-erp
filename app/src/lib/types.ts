export type Rec<F> = { id: string; createdTime: string; fields: F };

export const INVOICE_STATUSES = ['new', 'validated', 'generated', 'paid', 'error'] as const;
export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Dead', 'Duplicate'] as const;
export const LEAD_SOURCES = ['manual', 'telegram', 'web'] as const;
export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
export const TASK_STATUSES = ['open', 'done'] as const;
export const TASK_SOURCES = ['order', 'stock', 'lead', 'invoice', 'manual'] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskSource = (typeof TASK_SOURCES)[number];

export type InvoiceFields = {
  InvoiceNumber?: string;
  CustomerId: string;
  Amount: number;
  Items?: string;
  VatAmount?: number;
  Total?: number;
  Status?: InvoiceStatus;
  PdfUrl?: string;
  Created: string;
};
export type LeadFields = {
  Name: string;
  Email?: string;
  Company?: string;
  Phone?: string;
  Status?: LeadStatus;
  Source?: LeadSource;
  Note?: string;
  TelegramChatId?: string;
  Created: string;
};
export type CustomerFields = { CustomerId: string; Name: string; Email?: string; Phone?: string };
export type ProductFields = {
  Name: string;
  Sku?: string;
  Category?: string;
  Price?: number;
  Description?: string;
  InStock?: boolean;
  ImageUrl?: string;
};
/** הזמנה מהחנות. נכתבת על ידי WF10; האפליקציה קוראת אותה ומעדכנת רק את Status. */
export type OrderFields = {
  OrderNumber: string;
  CustomerId?: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  City?: string;
  /** JSON `[{sku,name,qty,price}]`, מחירים כוללי מע"מ. ראו `order-items.ts`. */
  Items?: string;
  Subtotal?: number;
  Shipping?: number;
  Vat?: number;
  Total?: number;
  Status?: OrderStatus;
  InvoiceNumber?: string;
  Note?: string;
  Created: string;
};
export type TaskFields = { Title: string; Status?: TaskStatus; Source?: TaskSource; RefId?: string; Created?: string };

export type Invoice = Rec<InvoiceFields>;
export type Lead = Rec<LeadFields>;
export type Customer = Rec<CustomerFields>;
export type Product = Rec<ProductFields>;
export type Order = Rec<OrderFields>;
export type Task = Rec<TaskFields>;

export type TableName = 'Invoices' | 'Leads' | 'Customers' | 'Products' | 'Orders' | 'Tasks';
