import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureInitialized } from "@/lib/content";
import { seedDatabase } from "@/lib/content";
import { getBotToken, getBotInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const TABLES = [
  "admin_users", "site_settings", "buses", "services", "advantages", "steps",
  "applications", "analytics_events", "media", "content_types", "content_items", "telegram_admins",
];

/** Визначає провайдера зовнішньої БД за рядком підключення (без пароля). */
function describeDatabase() {
  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    "";

  if (!raw) return { configured: false, provider: "не налаштовано", host: "", database: "", pooled: false, ssl: false };

  let host = "";
  let database = "";
  try {
    const url = new URL(raw);
    host = url.hostname;
    database = url.pathname.replace(/^\//, "");
  } catch {
    host = "-";
  }

  let provider = "PostgreSQL";
  if (/neon\.tech$/i.test(host)) provider = "Neon";
  else if (/supabase/i.test(host)) provider = "Supabase";
  else if (/vercel-storage|vercel\.com/i.test(host)) provider = "Vercel Postgres";
  else if (/localhost|127\.0\.0\.1/i.test(host)) provider = "Локальний PostgreSQL";

  return {
    configured: true,
    provider,
    host,
    database,
    pooled: /-pooler/.test(host),
    ssl: /sslmode=require|neon\.tech|supabase/i.test(raw),
  };
}

export async function GET(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = describeDatabase();
  const result: any = {
    database: db,
    env: {
      DATABASE_URL: !!db.configured,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL: !!process.env.VERCEL,
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    },
  };

  const started = Date.now();
  try {
    await ensureInitialized();
    await sql(`SELECT 1`);
    result.connected = true;
    result.latencyMs = Date.now() - started;

    const version = await sql(`SELECT version() AS v`);
    result.server = String(version[0]?.v || "").split(" ").slice(0, 2).join(" ");

    const counts: Record<string, number> = {};
    await Promise.all(
      TABLES.map(async (t) => {
        try {
          const rows = await sql(`SELECT COUNT(*)::int AS c FROM ${t}`);
          counts[t] = rows[0]?.c ?? 0;
        } catch {
          counts[t] = -1;
        }
      })
    );
    result.tables = counts;

    const botToken = await getBotToken();
    if (botToken) {
      const info = await getBotInfo();
      result.telegram = {
        configured: true,
        source: process.env.TELEGRAM_BOT_TOKEN ? "env" : "database",
        bot: info?.result?.username || null,
        ok: !!info?.ok,
      };
    } else {
      result.telegram = { configured: false };
    }
  } catch (e: any) {
    result.connected = false;
    result.error = e?.message || "Помилка підключення до бази";
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const action = String(body.action || "");
    if (action === "init-schema") {
      await ensureInitialized();
      return NextResponse.json({ success: true, message: "Схему бази перевірено та створено" });
    }
    if (action === "seed") {
      await ensureInitialized();
      const res = await seedDatabase(false);
      return NextResponse.json({ success: true, ...res });
    }
    return NextResponse.json({ error: "Невідома дія" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
