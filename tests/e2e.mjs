/**
 * Наскрізні перевірки (Playwright) для сайту та адмін-панелі.
 *
 * Запуск:
 *   npm i -D playwright-core           # один раз
 *   npm start                          # в іншому терміналі (або піднятий деплой)
 *   npm run test:e2e                   # перевіряє http://localhost:3000
 *
 * Опції (змінні середовища):
 *   BASE_URL      адреса сайту (типово http://localhost:3000)
 *   CHROME_PATH   шлях до Chromium/Chrome, якщо Playwright не має власного
 *   PW_CORE       шлях до модуля playwright-core (типово "playwright-core")
 *
 * Скрипт ідемпотентний: після перевірки приховування автобуса повертає його назад.
 */
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(process.env.PW_CORE_BASE || import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");

const EXE = process.env.CHROME_PATH || "";
const OUT = process.env.SHOT_DIR || "/tmp/busrent-shots";
const BASE = process.env.BASE_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });


const errors = [];
const results = [];
const ok = (name, cond, extra = "") => {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " :: " + extra : ""}`);
  if (!cond) errors.push(name + " " + extra);
};

const browser = await chromium.launch({
  ...(EXE ? { executablePath: EXE } : {}),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function newPage(w = 1440, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text().slice(0, 200)); });
  p.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  return p;
}

async function autoScroll(p) {
  await p.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
  });
}

/* ============================ LANDING: desktop ============================ */
let page = await newPage(1440, 950);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const title = await page.title();
ok("landing title", /BusRent/i.test(title), title);

const heroH1 = await page.locator("h1").first().innerText();
ok("hero h1 non-empty", heroH1.trim().length > 5, heroH1.slice(0, 60));

const busCards = await page.locator(".bus-card").count();
ok("bus cards rendered", busCards >= 8, "count=" + busCards);

const serviceCards = await page.locator(".service-card").count();
ok("service cards rendered", serviceCards >= 6, "count=" + serviceCards);

const advCards = await page.locator(".adv-card").count();
ok("advantage cards rendered", advCards >= 7, "count=" + advCards);

const stepCards = await page.locator(".step-card").count();
ok("step cards rendered", stepCards >= 4, "count=" + stepCards);

const customBlock = await page.locator("#block-faq").count();
ok("universal custom block (faq) rendered", customBlock === 1);

// nav anchors
const navLinks = await page.locator(".nav a").count();
ok("header nav links", navLinks === 5, "count=" + navLinks);

// hero buttons
ok("hero whatsapp button", await page.locator(".hero__actions a.btn--wa").count() >= 1);
ok("hero viber button", await page.locator(".hero__actions a.btn--viber").count() >= 1);

// floating buttons
ok("floating quick buttons", await page.locator(".floating a").count() >= 3);

await page.screenshot({ path: `${OUT}/01-landing-desktop-top.png` });
await autoScroll(page);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/01-landing-desktop-full.png`, fullPage: true });

/* -------- scroll reveal: every reveal element becomes visible -------- */
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
const hiddenReveal = await page.locator(".reveal:not(.reveal--visible)").count();
ok("scroll reveal activates elements", hiddenReveal === 0, "still hidden=" + hiddenReveal);

/* -------- "Замовити" on a bus card pre-selects the bus and scrolls to form -------- */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const orderBtn = page.locator(".bus-card .bus-card__price-row button.btn--accent").first();
const busName = await page.locator(".bus-card .bus-card__title").first().innerText();
await orderBtn.click();
await page.waitForTimeout(1100);
const selectVal = await page.locator("#form-bus").inputValue();
ok("bus 'Замовити' pre-selects bus in form", selectVal.toLowerCase().includes(busName.toLowerCase().slice(0, 8)), `sel="${selectVal}" bus="${busName}"`);
const formVisible = await page.locator("#form").isVisible();
ok("form section visible after CTA", formVisible);
await page.screenshot({ path: `${OUT}/02-form-preselected.png` });

/* -------- gallery modal -------- */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const photosBadge = await page.locator(".bus-card__photos-count").first().innerText().catch(() => "");
await page.locator(".bus-card__media").first().click();
await page.waitForTimeout(600);
ok("gallery modal opens", await page.locator(".modal__panel").count() === 1);
const thumbs = await page.locator(".gallery__thumb").count();
ok("gallery: >=5 photos per bus (spec 5-10)", thumbs >= 5, `thumbs=${thumbs} badge="${photosBadge}"`);
const cap1 = await page.locator(".gallery__caption").first().innerText().catch(() => "");
await page.locator(".gallery__thumb").nth(2).click();
await page.waitForTimeout(400);
const cap2 = await page.locator(".gallery__caption").first().innerText().catch(() => "");
ok("gallery: photo captions (exterior/interior/driver/luggage)", !!cap1 && !!cap2 && cap1 !== cap2, `"${cap1}" -> "${cap2}"`);
ok("gallery modal has close button", await page.locator(".modal__close").count() === 1);
await page.screenshot({ path: `${OUT}/03-bus-modal.png` });
await page.locator(".modal__close").click();
await page.waitForTimeout(400);
ok("gallery modal closes", await page.locator(".modal__panel").count() === 0);

/* -------- form validation + submit -------- */
await page.locator("form#form-name").count();
await page.fill("#form-name", "Іван Тестовий");
await page.fill("#form-phone", "abc");
await page.locator('form button[type="submit"]').click();
await page.locator(".form-alert--error").waitFor({ timeout: 20000 }).catch(() => {});
ok("invalid phone shows error", await page.locator(".form-alert--error").count() === 1);

await page.fill("#form-phone", "+380671112233");
await page.fill("#form-route", "Київ — Одеса");
await page.fill("#form-passengers", "30");
await page.fill("#form-message", "E2E перевірка форми");
await page.locator('form button[type="submit"]').click();
await page.locator(".form-alert--success").waitFor({ timeout: 30000 }).catch(() => {});
const success = await page.locator(".form-alert--success").count();
ok("valid submit shows success message", success === 1);
await page.screenshot({ path: `${OUT}/04-form-success.png` });

/* ============================ LANDING: mobile ============================ */
const m = await newPage(375, 812);
await m.goto(BASE + "/", { waitUntil: "networkidle" });
await m.waitForTimeout(700);
ok("mobile: burger visible", await m.locator(".burger").isVisible());
ok("mobile: desktop nav hidden", !(await m.locator(".nav").isVisible()));
await m.locator(".burger").click();
await m.waitForTimeout(500);
ok("mobile: drawer opens", await m.locator(".drawer--open").count() === 1);
await m.screenshot({ path: `${OUT}/05-mobile-drawer.png` });
await m.locator(".drawer__overlay").click({ position: { x: 10, y: 400 } });
await m.waitForTimeout(400);
ok("mobile: drawer closes", await m.locator(".drawer--open").count() === 0);
await m.screenshot({ path: `${OUT}/05-mobile-landing.png`, fullPage: true });

/* -------- horizontal overflow check -------- */
for (const [label, p, w] of [["desktop", page, 1440], ["mobile", m, 375]]) {
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(`${label}: no horizontal overflow`, sw <= w + 2, `scrollWidth=${sw}`);
}

/* ============================ TABLET ============================ */
const t = await newPage(820, 1000);
await t.goto(BASE + "/", { waitUntil: "networkidle" });
await t.waitForTimeout(500);
const tsw = await t.evaluate(() => document.documentElement.scrollWidth);
ok("tablet: no horizontal overflow", tsw <= 822, "scrollWidth=" + tsw);
await t.screenshot({ path: `${OUT}/06-tablet.png` });
await t.context().close();

/* ============================ ADMIN ============================ */
const a = await newPage(1440, 950);
await a.goto(BASE + "/adminpanel/login", { waitUntil: "networkidle" });
await a.waitForTimeout(500);
ok("admin login page", await a.locator(".a-login__card").count() === 1);
// wrong creds
await a.fill('input[type="email"]', "admin@bus-rent.ua");
await a.fill('input[type="password"]', "wrongpass");
await a.locator('form button[type="submit"]').click();
await a.locator(".a-error").waitFor({ timeout: 30000 }).catch(() => {});
ok("admin wrong password shows error", await a.locator(".a-error").count() === 1);
await a.screenshot({ path: `${OUT}/10-admin-login-error.png` });

await a.fill('input[type="password"]', "busrent2026");
await a.locator('form button[type="submit"]').click();
await a.waitForURL("**/adminpanel/dashboard", { timeout: 15000 });
await a.waitForTimeout(1200);
ok("admin logged in -> dashboard", a.url().includes("/adminpanel/dashboard"));
await a.screenshot({ path: `${OUT}/11-admin-dashboard.png`, fullPage: true });

const adminPages = [
  ["buses", "12-admin-buses", ".a-card"],
  ["services", "13-admin-services", ".a-card"],
  ["advantages", "14-admin-advantages", ".a-card"],
  ["steps", "15-admin-steps", ".a-card"],
  ["applications", "16-admin-applications", ".a-card"],
  ["builder", "17-admin-builder", ".a-card"],
  ["telegram", "20-admin-telegram", ".a-card"],
  ["system", "22-admin-system", ".a-card"],
  ["settings", "18-admin-settings", ".a-card"],
];
for (const [route, shot, sel] of adminPages) {
  await a.goto(`${BASE}/adminpanel/${route}`, { waitUntil: "networkidle" });
  await a.waitForTimeout(900);
  const cards = await a.locator(sel).count();
  ok(`admin /${route} renders`, cards >= 1, "cards=" + cards);
  await a.screenshot({ path: `${OUT}/${shot}.png`, fullPage: true });
}

/* -------- admin: open bus editor modal -------- */
await a.goto(`${BASE}/adminpanel/buses`, { waitUntil: "networkidle" });
await a.waitForTimeout(700);
await a.locator(".a-btn--primary", { hasText: "Додати транспорт" }).first().click();
await a.waitForTimeout(600);
ok("admin bus modal opens", await a.locator(".a-modal__panel").count() === 1);
ok("admin bus modal has photo manager", await a.locator(".a-photos, .a-drop").count() >= 1);
await a.screenshot({ path: `${OUT}/19-admin-bus-modal.png` });
await a.keyboard.press("Escape");
await a.waitForTimeout(400);

/* -------- admin: hide/show toggle on buses list -------- */
// приводим состояние к «все видимы» перед проверкой (тест должен быть идемпотентным)
let shown = 0;
while (await a.locator(".a-card button", { hasText: "Показати" }).count()) {
  await a.locator(".a-card button", { hasText: "Показати" }).first().click();
  await a.waitForTimeout(900);
  if (++shown > 20) break;
}
const before = await a.locator(".a-badge--off").count();
await a.locator(".a-card button", { hasText: "Приховати" }).first().click();
await a
  .waitForFunction((n) => document.querySelectorAll(".a-badge--off").length > n, before, { timeout: 40000 })
  .catch(() => {});
const after = await a.locator(".a-badge--off").count();
ok("admin hide bus works", after > before, `before=${before} after=${after}`);

// возвращаем автобус обратно, чтобы прогон не оставлял за собой изменений
await a.locator(".a-card button", { hasText: "Показати" }).first().click().catch(() => {});
await a.waitForTimeout(1200);
const restored = await a.locator(".a-badge--off").count();
ok("admin show bus restores it", restored === before, `restored=${restored} expected=${before}`);

/* -------- admin: Telegram bot section -------- */
await a.goto(`${BASE}/adminpanel/telegram`, { waitUntil: "networkidle" });
await a.waitForTimeout(2500);
const tgBody = await a.locator("body").innerText();
ok("telegram: shows the real bot @bussite_bot", /bussite_bot/.test(tgBody), tgBody.slice(0, 60).replace(/\n/g, " "));
ok("telegram: seeded admin Ігор listed", /899837838/.test(tgBody));
ok("telegram: seeded admin Дмитро listed", /1024336279/.test(tgBody));
const whUrl = await a.locator('input[readonly]').first().inputValue().catch(() => "");
ok("telegram: webhook url shown", /\/api\/telegram\/webhook/.test(whUrl), whUrl);
ok("telegram: how-to-add instructions present", /Як додати адміністратора/.test(tgBody));
await a.screenshot({ path: `${OUT}/20-admin-telegram.png`, fullPage: true });

// модалка добавления админа
await a.locator(".a-btn--primary", { hasText: "Додати адміністратора" }).first().click();
await a.waitForTimeout(600);
ok("telegram: add-admin modal opens", await a.locator(".a-modal__panel").count() === 1);
const modalText = await a.locator(".a-modal__panel").innerText();
ok("telegram: modal has Telegram ID field", /Telegram ID/i.test(modalText));
ok("telegram: modal has active toggle", /Отримує заявки/.test(modalText));
await a.screenshot({ path: `${OUT}/21-admin-telegram-add.png` });
await a.keyboard.press("Escape");
await a.waitForTimeout(400);

/* -------- landing: logo + dynamic SEO -------- */
const l = await newPage(1440, 950);
await l.goto(BASE + "/", { waitUntil: "networkidle" });
await l.waitForTimeout(600);
ok("landing: brand mark rendered (header+footer)", await l.locator(".brand__mark").count() >= 2);
const logoImgs = await l.locator(".brand__mark--logo img").count();
if (logoImgs > 0) {
  const logoSrc = await l.locator(".brand__mark--logo img").first().getAttribute("src");
  ok("landing: uploaded logo has a source", !!logoSrc && logoSrc.includes("/api/media/"), String(logoSrc));
} else {
  ok("landing: default SVG logo is used", (await l.locator(".brand__mark svg").count()) > 0);
}
ok("landing: SEO title comes from settings", /BusRent/.test(await l.title()), await l.title());
const desc = await l.locator('meta[name="description"]').first().getAttribute("content");
ok("landing: meta description present", !!desc && desc.length > 30, String(desc).slice(0, 50));
const ogTitle = await l.locator('meta[property="og:title"]').first().getAttribute("content").catch(() => null);
ok("landing: open graph tags present", !!ogTitle, String(ogTitle));
await l.screenshot({ path: `${OUT}/23-landing-logo.png` });
await l.context().close();

/* -------- security: upload and system API require auth -------- */
const noAuthUpload = await fetch(`${BASE}/api/upload`, { method: "POST" });
ok("security: upload endpoint requires auth", noAuthUpload.status === 401, "status=" + noAuthUpload.status);
const noAuthSystem = await fetch(`${BASE}/api/admin/system`);
ok("security: system API requires auth", noAuthSystem.status === 401, "status=" + noAuthSystem.status);
const noAuthAdmins = await fetch(`${BASE}/api/admin/content/telegram-admins`);
ok("security: admin content API requires auth", noAuthAdmins.status === 401, "status=" + noAuthAdmins.status);

/* -------- admin: system page details -------- */
const s2 = await newPage(1440, 950);
await s2.goto(BASE + "/adminpanel/login", { waitUntil: "networkidle" });
await s2.fill('input[type="email"]', "admin@bus-rent.ua");
await s2.fill('input[type="password"]', "busrent2026");
await s2.locator('form button[type="submit"]').click();
await s2.waitForURL("**/adminpanel/dashboard", { timeout: 30000 });
await s2.goto(`${BASE}/adminpanel/system`, { waitUntil: "networkidle" });
await s2.locator(".a-badge--on").first().waitFor({ timeout: 40000 }).catch(() => {});
const sysText = await s2.locator("body").innerText();
ok("system: database connection reported", /підключено/.test(sysText));
ok("system: provider detected", /Neon|Supabase|Vercel Postgres|Локальний PostgreSQL|PostgreSQL/.test(sysText));
ok("system: table row counts shown", /telegram_admins/.test(sysText));
ok("system: env variables listed", /DATABASE_URL/.test(sysText));
await s2.screenshot({ path: `${OUT}/22-admin-system.png`, fullPage: true });
await s2.context().close();

await browser.close();

console.log(results.join("\n"));
console.log("\n--- ERRORS ---");
console.log(errors.length ? errors.join("\n") : "none");
console.log(`\nTOTAL: ${results.filter(r=>r.startsWith("PASS")).length} passed, ${results.filter(r=>r.startsWith("FAIL")).length} failed`);
process.exit(errors.length ? 1 : 0);
