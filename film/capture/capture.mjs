// Authenticated, READ-ONLY captures (screenshots + screen recordings) using the profile
// saved by login.mjs. Nothing here writes to any system except the admin "mark shipped"
// step, which is opt-in via --ship.
// Usage: node film/capture/capture.mjs [--only name,name] [--ship]
import { chromium } from "../../store/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync, readdirSync, renameSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const captures = resolve(root, "captures");
mkdirSync(captures, { recursive: true });
const hero = JSON.parse(readFileSync(resolve(root, "data/hero-order.json"), "utf8"));
const ORD = hero.orderNumber;
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith("--only")) || "").split("=")[1]?.split(",") || null;
const SHIP = args.includes("--ship");

const N8N = "http://localhost:5678";
const WF = { wf13: "kn53i73OcuCaz3SZ", wf10: "9l2sTtJMunb5UTFE", wf1: "ZT0p1wXRsraCrUqA", wf8: "wNxCRwm0N2F6Z8TS", wf5: "GGC2TpFYltm7DrWF", wf5core: "BEuvek30KqE2zEM7", wf5handoff: "Eu2GW2o89m2r5Lam", wf3: "M7WjpE8Wd20EyOHZ", wf9core: "zFz32ARQ3kedlK1f", wferror: "WeWGjptjpf66sA7T" };
const AIRTABLE = "https://airtable.com/app1jXGnS2j0tCxEM";
const SUPABASE = "https://supabase.com/dashboard/project/kwlskuaqwjamlnoaqknw/editor";
const ADMIN = "https://ai-erp-rho.vercel.app";

const ctx = await chromium.launchPersistentContext(resolve(here, ".auth"), {
  headless: true, viewport: { width: 1920, height: 1080 }, locale: "he-IL",
  recordVideo: { dir: captures, size: { width: 1920, height: 1080 } },
});
const nocursor = (p) => p.addInitScript(() => { const s = document.createElement("style"); s.textContent = "*{cursor:none!important} html{scroll-behavior:auto!important}"; document.documentElement.appendChild(s); });
const results = [];

async function target(name, fn, { video = false } = {}) {
  if (only && !only.includes(name)) return;
  const page = await ctx.newPage(); await nocursor(page);
  try {
    await fn(page);
    if (!video) await page.screenshot({ path: `${captures}/${name}.png` });
    results.push([name, "ok"]);
  } catch (e) {
    results.push([name, "FAIL " + e.message.split("\n")[0]]);
    await page.screenshot({ path: `${captures}/_fail-${name}.png` }).catch(() => {});
  }
  const v = page.video();
  await page.close();
  if (video && v) { const path = await v.path(); renameSync(path, `${captures}/${name}.webm`); }
  else if (v) { try { const path = await v.path(); const { unlinkSync } = await import("node:fs"); unlinkSync(path); } catch {} }
}
const settle = (p, ms = 1500) => p.waitForTimeout(ms);

// ---------------- n8n canvases (zoom to fit = key "1") -----------------------
for (const [key, id] of Object.entries(WF)) {
  await target(`n8n-${key}-canvas`, async (p) => {
    await p.goto(`${N8N}/workflow/${id}`, { waitUntil: "networkidle" });
    await settle(p, 2500);
    await p.keyboard.press("1"); await settle(p, 800);
    // dismiss any callout/tooltip
    await p.keyboard.press("Escape").catch(() => {});
  });
}
// executions: the latest run of each workflow the hero order touched
for (const key of ["wf13", "wf10", "wf1", "wf8"]) {
  await target(`n8n-${key}-execution`, async (p) => {
    await p.goto(`${N8N}/workflow/${WF[key]}/executions`, { waitUntil: "networkidle" });
    await settle(p, 2500);
    const first = p.locator("[data-test-id='execution-list-item'], .execution-card, a[href*='/executions/']").first();
    await first.click({ timeout: 15000 }); await settle(p, 2500);
    await p.keyboard.press("1"); await settle(p, 800);
  });
}

// ---------------- Airtable tables, hero row selected ---------------------------
async function airtableTable(p, table, filter) {
  await p.goto(AIRTABLE, { waitUntil: "networkidle" }); await settle(p, 3000);
  await p.getByRole("link", { name: table, exact: true }).first().click({ timeout: 15000 }).catch(async () => { await p.getByText(table, { exact: true }).first().click({ timeout: 15000 }); });
  await settle(p, 3000);
  if (filter) { const cell = p.getByText(filter, { exact: false }).first(); await cell.click({ timeout: 10000 }).catch(() => {}); await settle(p, 800); }
}
await target("airtable-orders", (p) => airtableTable(p, "Orders", ORD));
await target("airtable-invoices", (p) => airtableTable(p, "Invoices", "INV-0011"));
await target("airtable-customers", (p) => airtableTable(p, "Customers", hero.customer.name));
await target("airtable-tasks", (p) => airtableTable(p, "Tasks", ORD));
await target("airtable-products-stock", (p) => airtableTable(p, "Products", hero.sku));

// ---------------- Supabase vector table --------------------------------------
await target("supabase-embeddings", async (p) => {
  await p.goto(SUPABASE, { waitUntil: "networkidle" }); await settle(p, 4000);
  await p.getByText("documents", { exact: true }).first().click({ timeout: 15000 }).catch(() => {});
  await settle(p, 4000);
});

// ---------------- Admin app ---------------------------------------------------
await target("admin-dashboard", async (p) => {
  await p.goto(`${ADMIN}/`, { waitUntil: "networkidle" }); await settle(p, 22000); // brief streams
}, { video: true });
await target("admin-attention", async (p) => { await p.goto(`${ADMIN}/`, { waitUntil: "networkidle" }); await settle(p, 6000); });
await target("admin-orders", async (p) => { await p.goto(`${ADMIN}/orders`, { waitUntil: "networkidle" }); await settle(p, 2500); });
await target("admin-order-detail", async (p) => {
  await p.goto(`${ADMIN}/orders`, { waitUntil: "networkidle" }); await settle(p, 2000);
  await p.getByText(ORD).first().click(); await p.waitForURL(/\/orders\//); await settle(p, 3000);
  if (SHIP) {
    await p.getByLabel("סטטוס הזמנה").selectOption({ label: "נשלחה" }).catch(() => p.getByLabel("סטטוס הזמנה").selectOption("shipped"));
    await settle(p, 5000);
  }
}, { video: true });
await target("admin-tasks-after", async (p) => { await p.goto(`${ADMIN}/tasks`, { waitUntil: "networkidle" }); await settle(p, 2500); });
await target("admin-products-stock", async (p) => { await p.goto(`${ADMIN}/products`, { waitUntil: "networkidle" }); await settle(p, 3000); });
await target("admin-cmdk", async (p) => {
  await p.goto(`${ADMIN}/`, { waitUntil: "networkidle" }); await settle(p, 3000);
  await p.keyboard.press("Meta+K"); await settle(p, 800);
  await p.keyboard.type("מה ההכנסות החודש?", { delay: 60 }); await p.keyboard.press("Enter");
  await settle(p, 16000);
}, { video: true });
await target("admin-invoice-detail", async (p) => {
  await p.goto(`${ADMIN}/invoices`, { waitUntil: "networkidle" }); await settle(p, 2000);
  await p.getByText("INV-0011").first().click(); await p.waitForURL(/\/invoices\//); await settle(p, 4000);
});

// ---------------- Drive PDF (public link from the tracking page) ---------------
await target("drive-pdf", async (p) => {
  await p.goto(hero.trackingUrl, { waitUntil: "networkidle" }); await settle(p, 2000);
  const href = await p.locator("a:has-text('PDF')").first().getAttribute("href");
  if (!href) throw new Error("no PDF link on tracking page");
  await p.goto(href, { waitUntil: "networkidle" }); await settle(p, 5000);
});

await ctx.close();
for (const [n, r] of results) console.log(r === "ok" ? "✓" : "✗", n, r === "ok" ? "" : r);
console.log(`\ncaptures in ${captures}`);
