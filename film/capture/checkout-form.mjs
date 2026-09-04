// Re-capture the filled checkout form with a placeholder email (no submit).
import { chromium } from "../../store/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { resolve, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const captures = resolve(dirname(fileURLToPath(import.meta.url)), "..", "captures");
const STORE = "https://ai-electronics-one.vercel.app", SKU = "TY-HP-200";
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "he-IL" })).newPage();
await page.addInitScript(() => { const s = document.createElement("style"); s.textContent = "*{cursor:none!important}"; document.documentElement.appendChild(s); });
await page.goto(`${STORE}/products/${SKU}`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
await page.locator('button:has-text("הוספה לסל")').first().click({ timeout: 30000 }); await page.waitForTimeout(1200);
await page.goto(`${STORE}/checkout`, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
await page.getByLabel("שם מלא").fill("דניאל כהן"); await page.getByLabel("אימייל").fill("daniel.cohen@gmail.com");
await page.getByLabel("טלפון").fill("052-6400123"); await page.getByLabel("כתובת").fill("שדרות מוריה 42"); await page.getByLabel("עיר").fill("חיפה");
await page.waitForTimeout(600); await page.screenshot({ path: `${captures}/store-checkout-filled.png` });
await browser.close(); console.log("ok");
