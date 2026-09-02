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
