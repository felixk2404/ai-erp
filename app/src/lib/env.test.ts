import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

function stubAll(overrides: Record<string, string> = {}) {
  const base: Record<string, string> = {
    AIRTABLE_PAT: 'pat',
    AIRTABLE_BASE_ID: 'app1jXGnS2j0tCxEM',
    N8N_WEBHOOK_URL: 'https://x/webhook',
    N8N_WEBHOOK_SECRET: 's',
    APP_PASSWORD: 'p',
    AUTH_SECRET: 'a'.repeat(32),
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) vi.stubEnv(k, v);
}

describe('env', () => {
  it('throws a readable error listing missing variables', async () => {
    stubAll({ AIRTABLE_PAT: '' });
    const { readEnv } = await import('./env');
    expect(() => readEnv()).toThrow(/AIRTABLE_PAT/);
  });

  it('strips a trailing slash from N8N_WEBHOOK_URL', async () => {
    stubAll({ N8N_WEBHOOK_URL: 'https://x/webhook/' });
    const { readEnv } = await import('./env');
    expect(readEnv().N8N_WEBHOOK_URL).toBe('https://x/webhook');
  });

  it('rejects a short AUTH_SECRET', async () => {
    stubAll({ AUTH_SECRET: 'short' });
    const { readEnv } = await import('./env');
    expect(() => readEnv()).toThrow(/AUTH_SECRET/);
  });
});
