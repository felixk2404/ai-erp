// צילומי מסך של כל המסכים (desktop + mobile) אחרי login. מתוך app/: OUT=<dir> node e2e/screens.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const base = process.env.BASE_URL ?? 'http://localhost:3100';
const out = process.env.OUT ?? '/private/tmp/claude-501/-Users-felixkreinovich-----------/5bf29461-8678-42ba-974e-ba55eb5d303b/scratchpad/shots';
const pages = ['/', '/invoices', '/leads', '/customers', '/products', '/tasks'];

const browser = await chromium.launch();
for (const [name, viewport] of [['desktop', { width: 1366, height: 860 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, locale: 'he-IL', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${base}/login`);
  await page.screenshot({ path: `${out}/${name}-login.png` });
  await page.getByLabel('סיסמה').fill(env.APP_PASSWORD);
  await page.getByRole('button', { name: 'כניסה' }).click();
  await page.waitForURL(`${base}/`);
  for (const p of pages) {
    await page.goto(base + p);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${out}/${name}${p === '/' ? '-dashboard' : p.replace('/', '-')}.png`, fullPage: true });
  }
  if (name === 'desktop') {
    await page.goto(base + '/invoices');
    await page.getByRole('button', { name: 'חשבונית חדשה' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/desktop-invoice-dialog.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'שאל את המנהל' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/desktop-chat.png` });
  }
  console.log(name, 'console errors:', errors.length ? errors : 'none');
  await ctx.close();
}
await browser.close();
