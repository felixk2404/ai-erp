import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./env', () => ({ env: () => ({ AIRTABLE_PAT: 'pat', AIRTABLE_BASE_ID: 'appX' }) }));

import { list, get, escapeFormula } from './airtable';

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });

describe('airtable', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists with filter/sort/max and follows the offset cursor', async () => {
    const f = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ records: [{ id: 'a', createdTime: 't', fields: {} }], offset: 'o1' }))
      .mockResolvedValueOnce(json({ records: [{ id: 'b', createdTime: 't', fields: {} }] }));
    const rows = await list('Invoices', { filter: "{Status}='new'", sort: [{ field: 'Created', direction: 'desc' }], max: 50 });
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
    const u1 = new URL(String(f.mock.calls[0][0]));
    expect(u1.pathname).toBe('/v0/appX/Invoices');
    expect(u1.searchParams.get('filterByFormula')).toBe("{Status}='new'");
    expect(u1.searchParams.get('sort[0][field]')).toBe('Created');
    expect(u1.searchParams.get('sort[0][direction]')).toBe('desc');
    expect(u1.searchParams.get('maxRecords')).toBe('50');
    expect((f.mock.calls[0][1]!.headers as Record<string, string>).Authorization).toBe('Bearer pat');
    expect(new URL(String(f.mock.calls[1][0])).searchParams.get('offset')).toBe('o1');
  });

  it('get returns null on 404 and list throws on 5xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nf', { status: 404 }));
    expect(await get('Tasks', 'recX')).toBeNull();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('boom', { status: 500 }));
    await expect(list('Tasks')).rejects.toThrow(/500/);
  });

  it('keeps the Airtable response body out of the thrown message and aborts on a hang', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{"error":{"type":"RATE_LIMIT_REACHED"}}', { status: 429 }));
    const e = await list('Invoices').catch((x: Error) => x);
    expect((e as Error).message).not.toMatch(/RATE_LIMIT_REACHED/);
    expect(f.mock.calls[0][1]!.signal).toBeInstanceOf(AbortSignal);
  });

  it('escapeFormula escapes quotes and backslashes', () => {
    expect(escapeFormula("O'Neil")).toBe("O\\'Neil");
    expect(escapeFormula('a\\b')).toBe('a\\\\b');
  });
});
