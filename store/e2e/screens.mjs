// צילומי מסך של כל מסכי החנות (desktop + mobile). מתוך store/: OUT=<dir> node e2e/screens.mjs
// אין login בחנות — הכל ציבורי. BASE_URL כדי לצלם את הפרודקשן.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL ?? 'http://localhost:3200';
const out = process.env.OUT ?? '/private/tmp/store-shots';
const pages = (process.env.PAGES ?? '/,/products,/products/TY-HP-200,/checkout,/track,/policies,/about').split(',');

mkdirSync(out, { recursive: true });

// עגלה זרועה כדי ש-/checkout לא יקפוץ ל-/products (העגלה ריקה מנתבת מחדש).
const CART = JSON.stringify({
  lines: [{ sku: 'TY-CB-UC100', name: 'כבל USB-C 100W באורך 2 מטר', price: 45, qty: 1, service: false }],
});

const slug = (p) => (p === '/' ? '-home' : p.replace(/\//g, '-'));

const browser = await chromium.launch();
for (const [name, viewport] of [['desktop', { width: 1366, height: 860 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, locale: 'he-IL', deviceScaleFactor: 1 });
  await ctx.addInitScript((cart) => localStorage.setItem('aie-cart-v1', cart), CART);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const p of pages) {
    await page.goto(base + p);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${out}/${name}${slug(p)}.png`, fullPage: true });
  }
  if (name === 'desktop') {
    await page.goto(base + '/products/TY-HP-200');
    await page.getByRole('button', { name: /הוסף לסל/ }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/desktop-cart.png` });
    await page.keyboard.press('Escape');
    await page.goto(base + '/');
    await page.getByRole('button', { name: 'שירות לקוחות' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/desktop-support.png` });
  }
  console.log(name, 'console errors:', errors.length ? errors : 'none');
  await ctx.close();
}
await browser.close();
