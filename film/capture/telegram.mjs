// Telegram Web + Gmail captures through Felix's debugging Chrome (CDP :9222).
// Requires: web.telegram.org logged in (QR) in that Chrome. Records frame sequences of the
// chat column and converts them to phone-shaped mp4s (1080x2160 crop of the chat area).
// Usage: node film/capture/telegram.mjs [--only=name,name]
import { chromium } from "../../store/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const captures = resolve(here, "..", "captures");
mkdirSync(captures, { recursive: true });
const only = (process.argv.find((a) => a.startsWith("--only")) || "").split("=")[1]?.split(",") || null;
const TG = "https://web.telegram.org/k/";
const MANAGER = "aielc_manager_bot", SUPPORT = "aielec_support_bot";

const browser = await chromium.connectOverCDP("http://localhost:9222");
const ctx = browser.contexts()[0];
const results = [];
const settle = (p, ms) => p.waitForTimeout(ms);

// Chat column clip (Telegram Web K layout): measure the chat area and crop to a phone aspect.
async function chatBox() { return { x: 0, y: 0, width: 480, height: 1000 }; }
let rec = null;
function startRec(page, name, clip) {
  const dir = `${captures}/_frames-${name}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  let i = 0;
  rec = { dir, name, timer: setInterval(() => { page.screenshot({ type: "jpeg", quality: 88, clip, path: `${dir}/f${String(i++).padStart(5, "0")}.jpg` }).catch(() => {}); }, 125) };
}
function stopRec() {
  if (!rec) return; clearInterval(rec.timer);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "8", "-i", `${rec.dir}/f%05d.jpg`, "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", `${captures}/${rec.name}.mp4`]);
  rmSync(rec.dir, { recursive: true, force: true }); rec = null;
}
async function target(name, fn, { video = false } = {}) {
  if (only && !only.includes(name)) return;
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 480, height: 1000 }); // phone width → Telegram Web single-column layout
  try {
    await fn(page, async (clip) => { if (video) startRec(page, name, clip); }, async () => { if (video) stopRec(); });
    results.push([name, "ok"]);
  } catch (e) {
    try { stopRec(); } catch {}
    results.push([name, "FAIL " + e.message.split("\n")[0]]);
    await page.screenshot({ path: `${captures}/_fail-${name}.png` }).catch(() => {});
  }
  await page.close();
}
async function openChat(page, bot) {
  await page.goto(`${TG}#@${bot}`, { waitUntil: "load" });
  await settle(page, 7000);
  await page.locator(".input-message-input").first().waitFor({ timeout: 30000 });
  await page.evaluate(() => { const s = document.createElement("style"); s.textContent = "*{cursor:none!important}"; document.head.appendChild(s); });
  await settle(page, 1500);
}
async function send(page, text) {
  const input = page.locator(".input-message-input").first();
  await input.click(); await input.fill(""); await page.keyboard.type(text, { delay: 40 }); await page.keyboard.press("Enter");
}
async function tapButton(page, label) {
  const b = page.locator(`.reply-markup-button:has-text("${label}"), button:has-text("${label}")`).last();
  await b.click({ timeout: 15000 });
}

// 1. manager bot: the order alert is the latest message → still + short push-in video
await target("telegram-order-alert", async (p, start, stop) => {
  await openChat(p, MANAGER);
  const clip = await chatBox(p);
  await p.screenshot({ path: `${captures}/telegram-order-alert.png`, clip });
  await start(clip); await settle(p, 4000); await stop();
}, { video: true });

// 2. manager bot: "מה לא שולם?"
await target("telegram-manager-unpaid", async (p, start, stop) => {
  await openChat(p, MANAGER);
  const clip = await chatBox(p);
  await start(clip); await settle(p, 800);
  await send(p, "מה לא שולם?");
  await settle(p, 16000); await stop();
  await p.screenshot({ path: `${captures}/telegram-manager-unpaid.png`, clip });
}, { video: true });

// 3. support bot: /menu → category → product → מעוניין → (phone request)
await target("telegram-catalog-menu", async (p, start, stop) => {
  await openChat(p, SUPPORT);
  const clip = await chatBox(p);
  await start(clip); await settle(p, 800);
  await send(p, "/menu");
  await p.locator(".reply-markup-button").last().waitFor({ timeout: 20000 }); await settle(p, 2500);
  await tapButton(p, "אוזניות"); await settle(p, 3500);
  await tapButton(p, "TY-200"); await settle(p, 3500);
  await tapButton(p, "מעוניין"); await settle(p, 5000);
  await settle(p, 1500); await stop();
  await p.screenshot({ path: `${captures}/telegram-catalog-menu.png`, clip });
}, { video: true });

// 4. support bot: handoff to a human
await target("telegram-handoff", async (p, start, stop) => {
  await openChat(p, SUPPORT);
  const clip = await chatBox(p);
  await start(clip); await settle(p, 800);
  await send(p, "אני רוצה לדבר עם נציג, דניאל 052-6400123");
  await settle(p, 18000); await stop();
  await p.screenshot({ path: `${captures}/telegram-handoff.png`, clip });
}, { video: true });

// 5. gmail: the latest outreach email in Sent (subject contains the business name)
await target("gmail-outreach", async (p) => {
  await p.setViewportSize({ width: 1920, height: 1080 });
  await p.goto("https://mail.google.com/mail/u/0/#search/in%3Asent+-%22%D7%90%D7%99%D7%A9%D7%95%D7%A8+%D7%94%D7%96%D7%9E%D7%A0%D7%94%22+-%22%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%AA%22", { waitUntil: "load" }); await settle(p, 7000);
  const row = p.locator("tr.zA").first(); await row.click({ timeout: 20000 }); await settle(p, 3000);
  await p.screenshot({ path: `${captures}/gmail-outreach.png` });
});

await browser.close().catch(() => {});
for (const [n, r] of results) console.log(r === "ok" ? "✓" : "✗", n, r === "ok" ? "" : r);
