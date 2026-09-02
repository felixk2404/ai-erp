import { WORKFLOWS, workflowById, type WorkflowMeta } from './workflows';

export type Execution = { id: string; status: string; startedAt: string | null; stoppedAt?: string | null; workflowId: string };

/** n8n מחזיר startedAt=null להרצות בתור. מנרמל: startedAt ← stoppedAt ← '' (מסונן מהחלון של 24h). */
const startOf = (e: Execution) => e.startedAt ?? e.stoppedAt ?? '';
const byNewest = (a: Execution, b: Execution) => startOf(b).localeCompare(startOf(a));
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
const isErr = (s: string) => s === 'error' || s === 'crashed';
const isRun = (s: string) => s === 'running' || s === 'waiting' || s === 'new';

/** מסכם הרצות n8n מ-24 השעות האחרונות. LED: ירוק = בלי שגיאות, ענבר = יש שגיאות, אדום = רק שגיאות, off = אין הרצות. */
export function summarizeExecutions(execs: Execution[], workflowNames: Record<string, string>, now = new Date()): Health {
  const recent = execs.filter((e) => now.getTime() - new Date(startOf(e)).getTime() <= DAY);
  const success = recent.filter((e) => e.status === 'success').length;
  const error = recent.filter((e) => isErr(e.status)).length;
  const running = recent.filter((e) => isRun(e.status)).length;
  const sorted = [...recent].sort(byNewest);
  const lastErr = sorted.find((e) => isErr(e.status));
  const led: Health['led'] = recent.length === 0 ? 'off' : error === 0 ? 'green' : success === 0 ? 'red' : 'amber';
  return {
    total: recent.length,
    success,
    error,
    running,
    lastRunAt: sorted[0] ? startOf(sorted[0]) : undefined,
    lastError: lastErr ? { at: startOf(lastErr), workflow: workflowNames[lastErr.workflowId] ?? lastErr.workflowId } : undefined,
    led,
  };
}

/* ---------- Pulse: פיד חי + מפת מערכת ---------- */

export type PulseStatus = 'success' | 'error' | 'running';
export type PulseEvent = { id: string; workflowId: string; workflow: string; status: PulseStatus; at: string; ms?: number };
export type NodeStatus = WorkflowMeta & {
  active?: boolean;
  runs24h: number;
  errors24h: number;
  lastRunAt?: string;
  led: Health['led'];
};
export type Pulse = { connected: boolean; at: string; health: Health | null; events: PulseEvent[]; nodes: NodeStatus[] };

export type WorkflowInfo = { id: string; name: string; active?: boolean };

const toStatus = (s: string): PulseStatus => (isErr(s) ? 'error' : isRun(s) ? 'running' : 'success');

/** הרצות → אירועי פיד (חדש→ישן, עד limit) + סטטוס לכל צומת במניפסט. טהור, נבדק. */
export function summarizePulse(execs: Execution[], workflows: WorkflowInfo[], now = new Date(), limit = 20): Omit<Pulse, 'connected' | 'at'> {
  const names: Record<string, string> = {};
  for (const w of workflows) names[w.id] = workflowById(w.id)?.name ?? w.name;
  const health = summarizeExecutions(execs, names, now);
  const events: PulseEvent[] = [...execs]
    .filter((e) => startOf(e))
    .sort(byNewest)
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      workflowId: e.workflowId,
      workflow: names[e.workflowId] ?? e.workflowId,
      status: toStatus(e.status),
      at: startOf(e),
      ms: e.stoppedAt && e.startedAt ? Math.max(0, new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()) : undefined,
    }));
  const recent = execs.filter((e) => now.getTime() - new Date(startOf(e)).getTime() <= DAY);
  const nodes: NodeStatus[] = WORKFLOWS.map((w) => {
    const mine = recent.filter((e) => e.workflowId === w.id).sort(byNewest);
    const errors24h = mine.filter((e) => isErr(e.status)).length;
    const info = workflows.find((x) => x.id === w.id);
    const led: Health['led'] = mine.length === 0 ? 'off' : errors24h === 0 ? 'green' : errors24h === mine.length ? 'red' : 'amber';
    return { ...w, active: info?.active, runs24h: mine.length, errors24h, lastRunAt: mine[0] ? startOf(mine[0]) : undefined, led };
  });
  return { health, events, nodes };
}

const api = () => {
  const base = process.env.N8N_API_URL?.replace(/\/+$/, '');
  const key = process.env.N8N_API_KEY;
  if (!base || !key) return null;
  return { base, headers: { 'X-N8N-API-KEY': key } };
};

async function fetchRaw(): Promise<{ execs: Execution[]; workflows: WorkflowInfo[] } | null> {
  const a = api();
  if (!a) return null;
  try {
    const [execRes, wfRes] = await Promise.all([
      fetch(`${a.base}/executions?limit=100`, { headers: a.headers, cache: 'no-store', signal: AbortSignal.timeout(4000) }),
      fetch(`${a.base}/workflows?limit=100`, { headers: a.headers, cache: 'no-store', signal: AbortSignal.timeout(4000) }),
    ]);
    if (!execRes.ok) return null;
    const execs = ((await execRes.json()) as { data: Execution[] }).data;
    const workflows = wfRes.ok ? ((await wfRes.json()) as { data: WorkflowInfo[] }).data : [];
    return { execs, workflows };
  } catch {
    return null;
  }
}

/** קורא מ-n8n Public API (בשרת בלבד). מחזיר null אם env חסר או שהשרת לא זמין. */
export async function fetchHealth(): Promise<Health | null> {
  const raw = await fetchRaw();
  if (!raw) return null;
  const names: Record<string, string> = {};
  for (const w of raw.workflows) names[w.id] = workflowById(w.id)?.name ?? w.name;
  return summarizeExecutions(raw.execs, names);
}

/** פיד + מפה. כשאין חיבור: המניפסט בלבד עם connected=false (המפה עדיין מוצגת). */
export async function fetchPulse(): Promise<Pulse> {
  const at = new Date().toISOString();
  const offline: Pulse = { connected: false, at, health: null, events: [], nodes: WORKFLOWS.map((w) => ({ ...w, runs24h: 0, errors24h: 0, led: 'off' })) };
  try {
    const raw = await fetchRaw();
    if (!raw) return offline;
    return { connected: true, at, ...summarizePulse(raw.execs, raw.workflows) };
  } catch {
    return offline; // צורת נתונים לא צפויה מ-n8n לא מפילה את הדשבורד
  }
}
