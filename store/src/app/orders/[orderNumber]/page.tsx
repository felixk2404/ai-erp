import type { Metadata } from 'next';
import { OrderView } from '@/components/orders/order-view';
import { normalizeOrderNumber } from '@/lib/order-status';

type Props = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `הזמנה ${normalizeOrderNumber(orderNumber)}` };
}

export default async function OrderPage({ params }: Props) {
  const { orderNumber } = await params;
  return <OrderView orderNumber={normalizeOrderNumber(orderNumber)} />;
}
