import { describe, it, expect } from 'vitest';
import { summarizeExecutions } from './n8n-health';

const now = new Date('2026-09-02T12:00:00.000Z');

describe('summarizeExecutions', () => {
  it('counts last-24h successes and errors and finds the latest error', () => {
    const s = summarizeExecutions(
      [
        { id: '1', status: 'success', startedAt: '2026-09-02T11:50:00Z', workflowId: 'a' },
        { id: '2', status: 'error', startedAt: '2026-09-02T09:00:00Z', workflowId: 'b' },
        { id: '3', status: 'success', startedAt: '2026-08-30T09:00:00Z', workflowId: 'a' }, // ישן — לא נספר
        { id: '4', status: 'running', startedAt: '2026-09-02T11:59:00Z', workflowId: 'a' },
      ],
      { b: 'WF8 — הפקת PDF חשבונית' },
      now,
    );
    expect(s).toEqual({ total: 3, success: 1, error: 1, running: 1, lastRunAt: '2026-09-02T11:59:00Z', lastError: { at: '2026-09-02T09:00:00Z', workflow: 'WF8 — הפקת PDF חשבונית' }, led: 'amber' });
  });
  it('is green with no errors and off with no runs', () => {
    expect(summarizeExecutions([{ id: '1', status: 'success', startedAt: '2026-09-02T11:50:00Z', workflowId: 'a' }], {}, now).led).toBe('green');
    expect(summarizeExecutions([], {}, now).led).toBe('off');
  });
});

describe('summarizePulse', () => {
  it('does not crash on queued executions with startedAt=null (n8n returns null while waiting)', async () => {
    const { summarizePulse } = await import('./n8n-health');
    const p = summarizePulse(
      [
        { id: 'q', status: 'new', startedAt: null, workflowId: 'kn53i73OcuCaz3SZ' },
        { id: 's', status: 'success', startedAt: '2026-09-02T11:50:00Z', stoppedAt: '2026-09-02T11:50:01Z', workflowId: 'kn53i73OcuCaz3SZ' },
        { id: 'w', status: 'waiting', startedAt: null, stoppedAt: '2026-09-02T11:55:00Z', workflowId: 'kn53i73OcuCaz3SZ' },
      ],
      [],
      now,
    );
    expect(p.events.map((e) => e.id)).toEqual(['w', 's']);
    expect(p.events[0].ms).toBeUndefined();
    expect(p.health?.total).toBe(2);
  });

  it('builds a newest-first feed with Hebrew workflow names and per-node LEDs', async () => {
    const { summarizePulse } = await import('./n8n-health');
    const p = summarizePulse(
      [
        { id: '1', status: 'success', startedAt: '2026-09-02T11:50:00Z', stoppedAt: '2026-09-02T11:50:02Z', workflowId: 'kn53i73OcuCaz3SZ' },
        { id: '2', status: 'error', startedAt: '2026-09-02T09:00:00Z', workflowId: 'wNxCRwm0N2F6Z8TS' },
        { id: '3', status: 'success', startedAt: '2026-09-02T10:00:00Z', workflowId: 'wNxCRwm0N2F6Z8TS' },
        { id: '4', status: 'success', startedAt: '2026-08-20T10:00:00Z', workflowId: 'unknown' },
      ],
      [{ id: 'kn53i73OcuCaz3SZ', name: 'WF13 API', active: true }],
      now,
      3,
    );
    expect(p.events.map((e) => e.id)).toEqual(['1', '3', '2']);
    expect(p.events[0]).toMatchObject({ workflow: 'API לאפליקציה', status: 'success', ms: 2000 });
    expect(p.events[2].status).toBe('error');
    const byKey = Object.fromEntries(p.nodes.map((n) => [n['key'], n]));
    expect(byKey.INVOICE_PDF).toMatchObject({ runs24h: 2, errors24h: 1, led: 'amber', lastRunAt: '2026-09-02T10:00:00Z' });
    expect(byKey.API).toMatchObject({ active: true, led: 'green', runs24h: 1 });
    expect(byKey.ERROR).toMatchObject({ led: 'off', runs24h: 0 });
    expect(p.nodes).toHaveLength(13);
    expect(p.health?.led).toBe('amber');
  });
});
