import sql from "./db";

/**
 * Telegram bot integration.
 *
 * The bot notifies registered administrators about new leads from the site and
 * answers a few commands. The token is taken from the environment first, and can
 * otherwise be edited from the admin panel (stored in `site_settings`).
 */

export async function getBotToken(): Promise<string> {
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN;
  if (fromEnv) return fromEnv.trim();
  try {
    const rows = await sql(`SELECT value FROM site_settings WHERE key = 'telegram_bot_token'`);
    return (rows[0]?.value || "").trim();
  } catch {
    return "";
  }
}

export async function hasBotToken(): Promise<boolean> {
  return !!(await getBotToken());
}

export async function tg(method: string, payload: Record<string, any> = {}): Promise<any> {
  const token = await getBotToken();
  if (!token) return { ok: false, description: "Токен бота не налаштований" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e: any) {
    return { ok: false, description: e?.message || "Помилка мережі" };
  }
}

export async function getBotInfo() {
  return tg("getMe");
}

export async function getWebhookInfo() {
  return tg("getWebhookInfo");
}

export async function setWebhook(url: string, secret?: string) {
  return tg("setWebhook", {
    url,
    allowed_updates: ["message", "edited_message", "callback_query"],
    drop_pending_updates: true,
    ...(secret ? { secret_token: secret } : {}),
  });
}

export async function deleteWebhook() {
  return tg("deleteWebhook", { drop_pending_updates: false });
}

export async function sendMessage(chatId: string | number, text: string, extra: Record<string, any> = {}) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

/* ------------------------------ bot admins ------------------------------ */
export async function listBotAdmins(onlyActive = false) {
  try {
    const rows = onlyActive
      ? await sql(`SELECT * FROM telegram_admins WHERE active = true ORDER BY id ASC`)
      : await sql(`SELECT * FROM telegram_admins ORDER BY id ASC`);
    return rows;
  } catch {
    return [];
  }
}

export async function isBotAdmin(telegramId: string | number): Promise<boolean> {
  try {
    const rows = await sql(
      `SELECT id FROM telegram_admins WHERE telegram_id = $1 AND active = true LIMIT 1`,
      [String(telegramId)]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Sends a message to every active bot administrator. */
export async function notifyAdmins(text: string) {
  const admins = await listBotAdmins(true);
  const targets = admins.map((a: any) => String(a.telegram_id));
  const fallbackChat = process.env.TELEGRAM_CHAT_ID;
  if (!targets.length && fallbackChat) targets.push(String(fallbackChat));

  const results: { id: string; name?: string; ok: boolean; error?: string }[] = [];
  for (const a of admins) {
    const r = await sendMessage(String(a.telegram_id), text);
    results.push({ id: String(a.telegram_id), name: a.name, ok: !!r.ok, error: r.ok ? undefined : r.description });
  }
  if (!admins.length && fallbackChat) {
    const r = await sendMessage(String(fallbackChat), text);
    results.push({ id: String(fallbackChat), ok: !!r.ok, error: r.ok ? undefined : r.description });
  }
  return results;
}

/* ------------------------------- webhook -------------------------------- */
export async function getWebhookSecret(): Promise<string> {
  try {
    const rows = await sql(`SELECT value FROM site_settings WHERE key = 'telegram_webhook_secret'`);
    return rows[0]?.value || "";
  } catch {
    return "";
  }
}

export async function ensureWebhookSecret(): Promise<string> {
  const existing = await getWebhookSecret();
  if (existing) return existing;
  const { createHash, randomBytes } = await import("crypto");
  const secret = createHash("sha256")
    .update(randomBytes(16).toString("hex") + (process.env.JWT_SECRET || "bus-rent"))
    .digest("hex")
    .slice(0, 32);
  await sql(
    `INSERT INTO site_settings (key, value) VALUES ('telegram_webhook_secret', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [secret]
  );
  return secret;
}

/* ------------------------------ commands -------------------------------- */
const HELP_TEXT = [
  "<b>Команди бота</b>",
  "/id — показати ваш Telegram ID",
  "/leads — останні заявки з сайту (для адміністраторів)",
  "/stats — статистика сайту (для адміністраторів)",
  "/help — ця довідка",
].join("\n");

const START_TEXT = [
  "<b>Вітаю! Це бот заявок сайту оренди автобусів.</b>",
  "",
  "Сюди надходитимуть нові заявки з форми на сайті.",
  "Щоб отримати свій Telegram ID — надішліть /id.",
].join("\n");

async function adminOnlyText(): Promise<string> {
  return "Ця команда доступна лише адміністраторам бота.\nНадішліть /id і додайте себе в адмін-панелі сайту.";
}

export async function handleTelegramUpdate(update: any): Promise<{ ok: boolean; action?: string }> {
  const msg = update?.message || update?.edited_message;
  if (!msg?.chat?.id) return { ok: true };

  const chatId = msg.chat.id;
  const text: string = (msg.text || "").trim();
  const from = msg.from || {};
  const command = text.split(/\s+/)[0].toLowerCase().replace(/@[a-z0-9_]+$/i, "");
  const admin = await isBotAdmin(from.id ?? chatId);

  if (command === "/start") {
    await sendMessage(chatId, START_TEXT);
    return { ok: true, action: "start" };
  }

  if (command === "/id") {
    await sendMessage(
      chatId,
      [
        "<b>Ваш Telegram ID</b>",
        `<code>${from.id ?? chatId}</code>`,
        "",
        "Додайте цей ID у адмін-панелі: <i>Telegram-бот → Адміністратори</i>.",
      ].join("\n")
    );
    return { ok: true, action: "id" };
  }

  if (command === "/help") {
    await sendMessage(chatId, HELP_TEXT);
    return { ok: true, action: "help" };
  }

  if (command === "/stats") {
    if (!admin) {
      await sendMessage(chatId, await adminOnlyText());
      return { ok: true, action: "denied" };
    }
    const [buses, services, apps, newApps] = await Promise.all([
      sql(`SELECT COUNT(*)::int AS c FROM buses WHERE active = true`),
      sql(`SELECT COUNT(*)::int AS c FROM services WHERE active = true`),
      sql(`SELECT COUNT(*)::int AS c FROM applications`),
      sql(`SELECT COUNT(*)::int AS c FROM applications WHERE status = 'new'`),
    ]);
    await sendMessage(
      chatId,
      [
        "<b>Статистика сайту</b>",
        `Автобусів у каталозі: <b>${buses[0]?.c ?? 0}</b>`,
        `Послуг: <b>${services[0]?.c ?? 0}</b>`,
        `Заявок усього: <b>${apps[0]?.c ?? 0}</b> (нових: <b>${newApps[0]?.c ?? 0}</b>)`,
      ].join("\n")
    );
    return { ok: true, action: "stats" };
  }

  if (command === "/leads") {
    if (!admin) {
      await sendMessage(chatId, await adminOnlyText());
      return { ok: true, action: "denied" };
    }
    const rows = await sql(`SELECT * FROM applications ORDER BY id DESC LIMIT 5`);
    if (!rows.length) {
      await sendMessage(chatId, "Заявок поки немає.");
      return { ok: true, action: "leads" };
    }
    const body = rows
      .map((a: any, i: number) =>
        [
          `<b>${i + 1}. ${escapeHtml(a.name)}</b> — ${escapeHtml(a.phone)}`,
          a.bus ? `Транспорт: ${escapeHtml(a.bus)}` : "",
          a.route ? `Маршрут: ${escapeHtml(a.route)}` : "",
          a.message ? `Коментар: ${escapeHtml(a.message)}` : "",
          `<i>${a.created_at ? new Date(a.created_at).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" }) : ""}</i>`,
        ]
          .filter(Boolean)
          .join("\n")
      )
      .join("\n\n");
    await sendMessage(chatId, `<b>Останні заявки</b>\n\n${body}`);
    return { ok: true, action: "leads" };
  }

  if (text) {
    await sendMessage(chatId, `Невідома команда. Надішліть /help.`);
    return { ok: true, action: "unknown" };
  }
  return { ok: true };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Formats a site lead for Telegram. */
export function formatLead(a: {
  name?: string; phone?: string; email?: string; bus?: string; route?: string; passengers?: string; message?: string;
}): string {
  return [
    "<b>Нова заявка з сайту</b>",
    `<b>Ім'я:</b> ${escapeHtml(a.name)}`,
    `<b>Телефон:</b> ${escapeHtml(a.phone)}`,
    a.email ? `<b>Email:</b> ${escapeHtml(a.email)}` : "",
    a.bus ? `<b>Транспорт:</b> ${escapeHtml(a.bus)}` : "",
    a.route ? `<b>Маршрут:</b> ${escapeHtml(a.route)}` : "",
    a.passengers ? `<b>Пасажирів:</b> ${escapeHtml(a.passengers)}` : "",
    a.message ? `<b>Коментар:</b> ${escapeHtml(a.message)}` : "",
    `<i>${new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}</i>`,
  ]
    .filter(Boolean)
    .join("\n");
}
