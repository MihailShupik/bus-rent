/**
 * Аудит мобільної адаптації (Playwright): 320–430px + адмінка з телефона.
 *
 *   npm run test:mobile
 *   BASE_URL=https://bus-rent.vercel.app npm run test:mobile
 *
 * Перевіряє: відсутність горизонтального переповнення, розмір кнопок (тап-зони),
 * одноколонкові сітки, вміщення галереї, бургер-меню та всі розділи адмінки.
 */
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(process.env.PW_CORE_BASE || import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");

const EXE = process.env.CHROME_PATH || "";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOT_DIR || "/tmp/busrent-mobile";
fs.mkdirSync(SHOTS, { recursive: true });

const b = await chromium.launch({
  ...(EXE ? { executablePath: EXE } : {}),
  headless: true,
  args: ["--no-sandbox"],
});
const rows = [];
const add = (w, item, ok, extra = "") => rows.push(`${ok ? "ok  " : "FAIL"} [${w}] ${item}${extra ? " :: " + extra : ""}`);

for (const w of [430, 390, 360, 320]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 850 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, 0); });
  await p.waitForTimeout(400);

  const r = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll("*").forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.right > vw + 1) bad.push(((el.className || el.tagName) + "").slice(0, 30) + "→" + Math.round(b.right));
    });
    // кнопки меньше 40px по высоте (неудобно нажимать пальцем)
    const small = [...document.querySelectorAll("button, a.btn")].filter((el) => {
      const b = el.getBoundingClientRect();
      return el.offsetParent && b.height > 0 && b.height < 36;
    }).map((el) => (el.textContent || "").trim().slice(0, 20) + " " + Math.round(el.getBoundingClientRect().height));
    // сетки в одну колонку?
    const grid = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).gridTemplateColumns.split(" ").length : 0; };
    return {
      scrollW: document.documentElement.scrollWidth, vw,
      bad: bad.slice(0, 5),
      small: small.slice(0, 5),
      busCols: grid(".buses-grid"), svcCols: grid(".cards-grid"), advCols: grid(".adv-grid"),
      stepCols: grid(".steps-grid"), statCols: grid(".stats"), formCols: grid(".form-grid"),
    };
  });
  add(w, "нет горизонтального переполнения", r.scrollW <= r.vw + 1, `scrollW=${r.scrollW} vw=${r.vw}`);
  if (r.bad.length) add(w, "элементы не выходят за экран", false, r.bad.join(", "));
  add(w, "нет слишком маленьких кнопок (<36px)", r.small.length === 0, r.small.join(", "));
  add(w, "сетки в одну колонку", r.busCols === 1 && r.svcCols === 1 && r.advCols === 1 && r.formCols === 1,
      `buses=${r.busCols} svc=${r.svcCols} adv=${r.advCols} steps=${r.stepCols} stats=${r.statCols} form=${r.formCols}`);

  // галерея
  await p.locator(".bus-card__media").first().click();
  await p.waitForTimeout(700);
  const g = await p.evaluate(() => {
    const m = document.querySelector(".modal__panel");
    if (!m) return null;
    const b = m.getBoundingClientRect();
    return { w: Math.round(b.width), h: Math.round(b.height), vw: document.documentElement.clientWidth, vh: innerHeight, thumbs: document.querySelectorAll(".gallery__thumb").length };
  });
  add(w, "галерея помещается на экран", !!g && g.w <= g.vw + 1 && g.h <= g.vh + 1, g ? `${g.w}×${g.h} (экран ${g.vw}×${g.vh})` : "не открылась");
  await p.screenshot({ path: `${SHOTS}/m${w}-gallery.png` });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${SHOTS}/m${w}-full.png`, fullPage: true });
  await p.context().close();
}

// ---------- админка с телефона ----------
const a = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await a.goto(BASE + "/adminpanel/login", { waitUntil: "domcontentloaded", timeout: 60000 });
await a.waitForTimeout(1000);
await a.fill('input[type="email"]', "admin@bus-rent.ua");
await a.fill('input[type="password"]', "busrent2026");
await a.locator('form button[type="submit"]').click();
await a.waitForURL("**/adminpanel/dashboard", { timeout: 40000 });
await a.waitForTimeout(1500);
const burger = await a.locator(".a-burger").isVisible();
add(390, "админка: есть бургер-меню", burger);
await a.screenshot({ path: "${SHOTS}/admin-dashboard.png", fullPage: true });
if (burger) {
  await a.locator(".a-burger").click(); await a.waitForTimeout(500);
  const drawerOpen = await a.locator(".a-side.open").count() === 1;
  add(390, "админка: меню открывается", drawerOpen);
  await a.screenshot({ path: "${SHOTS}/admin-menu.png" });
  await a.locator(".a-overlay").click({ position: { x: 380, y: 700 } }).catch(() => {});
  await a.waitForTimeout(500);
}
for (const route of ["buses", "applications", "telegram", "settings", "builder"]) {
  await a.goto(`${BASE}/adminpanel/${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await a.waitForTimeout(1200);
  const rr = await a.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  add(390, `админка /${route}: без переполнения`, rr.sw <= rr.vw + 1, `scrollW=${rr.sw} vw=${rr.vw}`);
  await a.screenshot({ path: `${SHOTS}/admin-${route}.png`, fullPage: true });
}
await a.context().close();
await b.close();
console.log(rows.join("\n"));
const fails = rows.filter((r) => r.startsWith("FAIL"));
console.log(`\nИтого: ${rows.length - fails.length}/${rows.length} проверок мобильной адаптации пройдено`);
