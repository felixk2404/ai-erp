// Read-only public captures (no login, no writes): storefront pages + support widget.
// Usage: node film/capture/public.mjs
import { chromium } from "../../store/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const captures = resolve(here, "..", "captures");
mkdirSync(captures, { recursive: true });
const STORE = process.env.STORE_URL || "https://ai-electronics-one.vercel.app";
const SKU = process.env.HERO_SKU || "TY-HP-200";
const hideCursor = (page) => page.addInitScript(() => { const s = document.createElement("style"); s.textContent = "*{cursor:none!important}"; document.documentElement.appendChild(s); });

const browser = await chromium.launch({ headless: true });

// --- stills --------------------------------------------------------------------
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "he-IL" });
const page = await ctx.newPage(); await hideCursor(page);
for (const [name, url, settle] of [
  ["store-home", "/", 2500],
  ["store-catalog", "/products", 2000],
  ["store-product", `/products/${SKU}`, 1500],
  ["store-checkout-empty", "/checkout", 1200],
]) {
  await page.goto(STORE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(settle);
  await page.screenshot({ path: `${captures}/${name}.png` });
  console.log("still", name);
}
// catalog filtered to headphones
await page.goto(STORE + "/products", { waitUntil: "networkidle" });
await page.getByRole("group", { name: "קטגוריות" }).getByRole("button", { name: "אוזניות" }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${captures}/store-catalog-headphones.png` });
await ctx.close();

// --- videos ----------------------------------------------------------------------
async function record(name, fn) {
  const c = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "he-IL", recordVideo: { dir: captures, size: { width: 1920, height: 1080 } } });
  const p = await c.newPage(); await hideCursor(p);
  await fn(p);
  await c.close();
  const webm = readdirSync(captures).find((f) => f.startsWith("page@") && f.endsWith(".webm"));
  if (webm) renameSync(`${captures}/${webm}`, `${captures}/${name}.webm`);
  console.log("video", name);
}

// add to cart → cart sheet opens
await record("store-cart", async (p) => {
  await p.goto(`${STORE}/products/${SKU}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.locator('button:has-text("הוספה לסל")').first().click({ timeout: 30_000 });
  await p.waitForTimeout(2500);
});

// support widget: stock question → answer (WF13 support → WF5-core, read-only)
await record("support-widget", async (p) => {
  await p.goto(`${STORE}/products/${SKU}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const opener = p.getByRole("button", { name: "שירות לקוחות" }).first();
  await opener.click();
  await p.waitForTimeout(1200);
  const box = p.getByRole("textbox", { name: "הודעה" });
  await box.fill("יש לכם אוזניות אלחוטיות במלאי? כמה עולה?");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(14_000);
  await box.fill("אפשר 30% הנחה?");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(12_000);
  await p.screenshot({ path: `${captures}/support-widget-end.png` });
});

await browser.close();
