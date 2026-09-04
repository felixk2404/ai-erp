// Places the film's hero order on the live storefront and records the journey.
// Usage: node film/capture/hero-order.mjs   (from repo root; uses store's playwright)
// Output: film/captures/store-*.png|webm, film/data/hero-order.json
import { chromium } from "../../store/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync, readdirSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const captures = resolve(root, "captures");
mkdirSync(captures, { recursive: true });
const BASE = process.env.STORE_URL || "https://ai-electronics-one.vercel.app";
const SKU = process.env.HERO_SKU || "TY-HP-200"; // אוזניות אלחוטיות TY-200
const customer = { name: "דניאל כהן", email: "felixk4302@gmail.com", phone: "052-6400123", address: "שדרות מוריה 42", city: "חיפה" };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: "he-IL",
  recordVideo: { dir: captures, size: { width: 1920, height: 1080 } },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
await page.addInitScript(() => { const s = document.createElement("style"); s.textContent = "*{cursor:none!important}"; document.documentElement.appendChild(s); });

// 1. product page
await page.goto(`${BASE}/products/${SKU}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${captures}/store-product.png` });

// 2. add to cart → cart sheet
await page.locator('button:has-text("הוספה לסל")').first().click({ timeout: 30_000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${captures}/store-cart.png` });

// 3. checkout form
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByLabel("שם מלא").fill(customer.name);
await page.getByLabel("אימייל").fill(customer.email);
await page.getByLabel("טלפון").fill(customer.phone);
await page.getByLabel("כתובת").fill(customer.address);
await page.getByLabel("עיר").fill(customer.city);
await page.waitForTimeout(600);
await page.screenshot({ path: `${captures}/store-checkout-filled.png` });

// 4. submit → WF13 → WF10 (up to 90 s)
const placedAt = new Date().toISOString();
await page.getByRole("button", { name: /אישור הזמנה/ }).click();
await page.waitForURL(/\/orders\/ORD-\d+/, { timeout: 120_000 });
await page.getByText("מספר הזמנה").waitFor({ timeout: 60_000 });
await page.waitForTimeout(1500);
const orderNumber = page.url().match(/ORD-\d+/)[0];
await page.screenshot({ path: `${captures}/store-confirmation.png` });
const bodyText = await page.locator("main").innerText();

// 5. wait for the PDF link on the tracking page (WF1 + WF8, every minute)
let pdfSeen = false;
for (let i = 0; i < 10 && !pdfSeen; i++) {
  await page.waitForTimeout(20_000);
  await page.reload({ waitUntil: "networkidle" });
  pdfSeen = (await page.locator("a[href*='drive.google'], a[href*='.pdf'], a:has-text('PDF')").count()) > 0;
}
await page.waitForTimeout(1000);
await page.screenshot({ path: `${captures}/store-tracking.png` });
const trackingText = await page.locator("main").innerText();

await ctx.close();
await browser.close();
// rename the recorded video
const webm = readdirSync(captures).find((f) => f.startsWith("page@") && f.endsWith(".webm"));
if (webm) renameSync(`${captures}/${webm}`, `${captures}/store-journey.webm`);

const hero = { orderNumber, sku: SKU, product: "אוזניות אלחוטיות TY-200", customer, placedAt, pdfSeen,
  trackingUrl: `${BASE}/orders/${orderNumber}`, confirmationText: bodyText.slice(0, 600), trackingText: trackingText.slice(0, 600) };
writeFileSync(resolve(root, "data/hero-order.json"), JSON.stringify(hero, null, 2));
console.log(JSON.stringify({ orderNumber, pdfSeen, trackingUrl: hero.trackingUrl }, null, 2));
