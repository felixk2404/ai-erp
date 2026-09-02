export type Execution = { id: string; status: string; startedAt: string; workflowId: string };
export type Health = {
  total: number;
  success: number;
  error: number;
  running: number;
  lastRunAt?: string;
  lastError?: { at: string; workflow: string };
  led: 'green' | 'amber' | 'red' | 'off';
};

const DAY = 24 * 60 * 60 * 1000;

/** מסכם הרצות n8n מ-24 השעות האחרונות. LED: ירוק = בלי שגיאות, ענבר = יש שגיאות, אדום = רק שגיאות, off = אין הרצות. */
export function summarizeExecutions(execs: Execution[], workflowNames: Record<string, string>, now = new Date()): Health {
  const recent = execs.filter((e) => now.getTime() - new Date(e.startedAt).getTime() <= DAY);
  const success = recent.filter((e) => e.status === 'success').length;
  const error = recent.filter((e) => e.status === 'error' || e.status === 'crashed').length;
  const running = recent.filter((e) => e.status === 'running' || e.status === 'waiting' || e.status === 'new').length;
  const sorted = [...recent].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const lastErr = sorted.find((e) => e.status === 'error' || e.status === 'crashed');
  const led: Health['led'] = recent.length === 0 ? 'off' : error === 0 ? 'green' : success === 0 ? 'red' : 'amber';
  return {
    total: recent.length,
    success,
    error,
    running,
    lastRunAt: sorted[0]?.startedAt,
    lastError: lastErr ? { at: lastErr.startedAt, workflow: workflowNames[lastErr.workflowId] ?? lastErr.workflowId } : undefined,
    led,
  };
}

/** קורא מ-n8n Public API (בשרת בלבד). מחזיר null אם env חסר או שהשרת לא זמין. */
export async function fetchHealth(): Promise<Health | null> {
  const base = process.env.N8N_API_URL?.replace(/\/+$/, '');
  const key = process.env.N8N_API_KEY;
  if (!base || !key) return null;
  const headers = { 'X-N8N-API-KEY': key };
  try {
    const [execRes, wfRes] = await Promise.all([
      fetch(`${base}/executions?limit=100`, { headers, cache: 'no-store', signal: AbortSignal.timeout(4000) }),
      fetch(`${base}/workflows?limit=100`, { headers, cache: 'no-store', signal: AbortSignal.timeout(4000) }),
    ]);
    if (!execRes.ok) return null;
    const execs = ((await execRes.json()) as { data: Execution[] }).data;
    const names: Record<string, string> = {};
    if (wfRes.ok) for (const w of ((await wfRes.json()) as { data: { id: string; name: string }[] }).data) names[w.id] = w.name;
    return summarizeExecutions(execs, names);
  } catch {
    return null;
  }
}
