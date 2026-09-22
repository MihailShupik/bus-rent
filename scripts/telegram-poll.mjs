#!/usr/bin/env node
/**
 * Локальний «polling» для Telegram-бота (коли немає публічного HTTPS).
 *
 * На продакшені (Vercel) використовується webhook - кнопка в адмінці.
 * Локально цей скрипт кожні 2 секунди забирає апдейти в Telegram і передає їх
 * у той самий обробник, що й webhook, тож команди /start, /id, /leads, /stats
 * працюють і на локальній машині.
 *
 * Запуск (у другому терміналі, поки працює `npm start`):
 *   node scripts/telegram-poll.mjs
 *
 * Змінні (за замовчуванням беруться з .env.local або зі стандартних значень):
 *   SITE_URL   - адреса сайту (типово http://localhost:3000)
 *   ADMIN_EMAIL, ADMIN_PASSWORD - доступ до адмінки
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fileEnv = { ...loadEnvFile(join(ROOT, ".env")), ...loadEnvFile(join(ROOT, ".env.local")) };
const SITE_URL = (process.env.SITE_URL || fileEnv.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL || fileEnv.ADMIN_EMAIL || "admin@bus-rent.ua";
const PASSWORD = process.env.ADMIN_PASSWORD || fileEnv.ADMIN_PASSWORD || "busrent2026";

let token = "";

async function login() {
  const res = await fetch(`${SITE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не вдалося увійти в адмінку");
  token = data.token;
}

async function pollOnce() {
  const res = await fetch(`${SITE_URL}/api/admin/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "poll" }),
  });
  if (res.status === 401) {
    await login();
    return;
  }
  const data = await res.json();
  if (data.error) {
    console.error("Помилка:", data.error);
    return;
  }
  if (data.processed) {
    console.log(`Оброблено апдейтів: ${data.processed} → ${(data.actions || []).join(", ") || "без команд"}`);
  }
}

async function main() {
  console.log(`Polling Telegram-бота через ${SITE_URL} ...`);
  await login();
  console.log("Підключено. Натисніть Ctrl+C, щоб зупинити.\n");
  while (true) {
    try {
      await pollOnce();
    } catch (e) {
      console.error("Помилка опитування:", e.message);
      await new Promise((r) => setTimeout(r, 3000));
      try { await login(); } catch {}
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
