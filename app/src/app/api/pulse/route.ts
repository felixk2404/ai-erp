import { NextResponse } from 'next/server';
import { fetchPulse } from '@/lib/n8n-health';

export const dynamic = 'force-dynamic';

/** פיד n8n חי לדשבורד. מאחורי ה-proxy (דורש session). מחזיר שמות/סטטוסים/זמנים בלבד. */
export async function GET() {
  return NextResponse.json(await fetchPulse(), { headers: { 'cache-control': 'no-store' } });
}
