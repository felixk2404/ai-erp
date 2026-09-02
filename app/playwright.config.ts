import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';

// קורא APP_PASSWORD מ-.env.local כדי שהבדיקות יוכלו להתחבר (בלי dotenv).
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  /* אין .env.local — הבדיקות ידלגו על login */
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: { baseURL, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', viewport: { width: 1280, height: 800 } },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: 'pnpm dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
  reporter: [['list']],
});
