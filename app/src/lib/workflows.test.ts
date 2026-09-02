import { describe, expect, it } from 'vitest';
import { WORKFLOWS, workflowById } from './workflows';

describe('workflows manifest', () => {
  it('has 13 workflows with unique ids, keys and Hebrew names', () => {
    expect(WORKFLOWS).toHaveLength(13);
    expect(new Set(WORKFLOWS.map((w) => w.id)).size).toBe(13);
    expect(new Set(WORKFLOWS.map((w) => w.key)).size).toBe(13);
    expect(new Set(WORKFLOWS.map((w) => w.name)).size).toBe(13);
    for (const w of WORKFLOWS) expect(w.name).toMatch(/[֐-׿]/);
  });
  it('has exactly one hub', () => {
    expect(WORKFLOWS.filter((w) => w.role === 'hub')).toHaveLength(1);
    expect(workflowById('kn53i73OcuCaz3SZ')?.key).toBe('API');
    expect(workflowById('nope')).toBeUndefined();
  });
});
