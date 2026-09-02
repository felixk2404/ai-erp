export type Rec<F> = { id: string; createdTime: string; fields: F };

export type TableName = 'Products' | 'Orders';

export type ProductFields = {
  Name: string;
  Sku?: string;
  Category?: string;
  Price?: number;
  Description?: string;
  InStock?: boolean;
  Stock?: number;
  Highlights?: string;
  ImageUrl?: string;
};
export type Product = Rec<ProductFields>;

export type OrderItem = { sku: string; name: string; qty: number; price: number };

export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  created: string;
  invoiceNumber: string | null;
  pdfUrl: string | null;
  invoiceStatus: string | null;
};
