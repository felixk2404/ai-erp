// One-time login for the authenticated captures. Opens a real (headed) Chromium with a
// persistent profile at film/capture/.auth (git-ignored). Log in to every tab, then press
// Enter in the terminal. capture.mjs reuses the profile headless afterwards.
// Usage: node film/capture/login.mjs
import { chromium } from "../../store/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stdin } from "node:process";

const here = dirname(fileURLToPath(import.meta.url));
const profile = resolve(here, ".auth");
const tabs = [
  ["n8n", "http://localhost:5678/home/workflows"],
  ["Airtable", "https://airtable.com/app1jXGnS2j0tCxEM"],
  ["Supabase", "https://supabase.com/dashboard/project/kwlskuaqwjamlnoaqknw/editor"],
  ["Admin app", "https://ai-erp-rho.vercel.app/login"],
];
const ctx = await chromium.launchPersistentContext(profile, { headless: false, viewport: { width: 1600, height: 1000 }, locale: "he-IL" });
for (const [name, url] of tabs) {
  const p = await ctx.newPage();
  await p.goto(url).catch(() => {});
  console.log(`→ ${name}: ${url}`);
}
console.log("\nהתחבר בכל אחת מארבע הלשוניות (n8n, Airtable, Supabase, האפליקציה). כשסיימת, חזור לכאן ולחץ Enter.");
await new Promise((r) => stdin.once("data", r));
await ctx.close();
console.log("saved session profile at film/capture/.auth");
process.exit(0);
