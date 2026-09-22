import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureInitialized } from "@/lib/content";
import {
  deleteWebhook, ensureWebhookSecret, getBotInfo, getWebhookInfo, hasBotToken,
  listBotAdmins, pollUpdates, sendMessage, setWebhook,
} from "@/lib/telegram";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

function baseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureInitialized();
    const configured = await hasBotToken();
    const [bot, admins] = await Promise.all([
      configured ? getBotInfo() : Promise.resolve({ ok: false }),
      listBotAdmins(false),
    ]);
    let webhook = configured ? await getWebhookInfo() : { ok: false };

    const siteUrl = baseUrl(request);
    const isPublicHttps = /^https:\/\//.test(siteUrl) && !/localhost|127\.0\.0\.1|\.local/.test(siteUrl);

    // Автоматично реєструємо webhook на публічному HTTPS-домені, якщо його ще немає.
    // Так бот «просто працює» після деплою — без ручних кнопок.
    // Якщо webhook уже вказано (напр. на інший домен), не чіпаємо.
    let autoWebhook: any = null;
    const currentUrl = webhook?.result?.url || "";
    if (configured && isPublicHttps && !currentUrl) {
      const secret = await ensureWebhookSecret();
      const target = `${siteUrl}/api/telegram/webhook`;
      const res = await setWebhook(target, secret);
      autoWebhook = { ok: !!res.ok, url: target, error: res.ok ? undefined : res.description };
      if (res.ok) webhook = await getWebhookInfo();
    }

    const tokenFromEnv = !!process.env.TELEGRAM_BOT_TOKEN;
    return NextResponse.json({
      configured,
      tokenFromEnv,
      bot,
      webhook,
      admins,
      autoWebhook,
      // заявки з сайту надходять завжди (вихідний виклик), команди — лише через webhook або polling
      leadsAlwaysWork: configured,
      siteUrl,
      isPublicHttps,
      webhookUrl: `${siteUrl}/api/telegram/webhook`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureInitialized();
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "save-token") {
      if (process.env.TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: "Токен задано через змінну середовища TELEGRAM_BOT_TOKEN — змініть його там." }, { status: 400 });
      }
      const token = String(body.token || "").trim();
      if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
        return NextResponse.json({ error: "Невірний формат токена (очікується 123456:AA...)" }, { status: 400 });
      }
      await sql(
        `INSERT INTO site_settings (key, value) VALUES ('telegram_bot_token', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [token]
      );
      const info = await getBotInfo();
      return NextResponse.json({ success: true, bot: info });
    }

    if (!(await hasBotToken())) {
      return NextResponse.json({ error: "Спочатку вкажіть токен бота" }, { status: 400 });
    }

    if (action === "set-webhook") {
      const secret = await ensureWebhookSecret();
      const url = String(body.url || `${baseUrl(request)}/api/telegram/webhook`);
      const res = await setWebhook(url, secret);
      return NextResponse.json({ success: !!res.ok, telegram: res, url });
    }

    if (action === "delete-webhook") {
      const res = await deleteWebhook();
      return NextResponse.json({ success: !!res.ok, telegram: res });
    }

    if (action === "test") {
      const admins = await listBotAdmins(true);
      if (!admins.length) {
        return NextResponse.json({ error: "Немає активних адміністраторів бота" }, { status: 400 });
      }
      const text = "🔔 <b>Тестове повідомлення</b>\nБот підключено до сайту оренди автобусів.";
      const results = [];
      for (const a of admins) {
        const r = await sendMessage(String(a.telegram_id), text);
        results.push({ id: String(a.telegram_id), name: a.name, ok: !!r.ok, error: r.ok ? undefined : r.description });
      }
      const delivered = results.filter((r) => r.ok).length;
      return NextResponse.json({ success: delivered > 0, results, delivered, total: results.length });
    }

    if (action === "poll") {
      const result = await pollUpdates();
      return NextResponse.json({ success: !result.error, ...result });
    }

    return NextResponse.json({ error: "Невідома дія" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
