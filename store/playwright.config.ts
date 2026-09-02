import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';

// קורא משתני סביבה מ-.env.local כדי שהבדיקות ירוצו מול n8n/Airtable אמיתיים (בלי dotenv).
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  /* אין קובץ משתני סביבה מקומי — הבדיקות שדורשות שרת ייכשלו במפורש */
}

// 3200: הניהול תופס 3100, ופורט 3000 תפוס לעתים על ידי פרויקטים אחרים במחשב הזה.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3200';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  // dev server מקמפל עמוד ראשון ב-10–25s כשהמק עמוס; 5s ברירת המחדל של expect נופל על זה.
  expect: { timeout: 20_000 },
  retries: 0,
  use: { baseURL, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', viewport: { width: 1280, height: 800 } },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: 'pnpm dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
  reporter: [['list']],
});
