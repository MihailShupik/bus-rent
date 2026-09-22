import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Публічна перевірка стану (без секретів) - щоб після деплою одним запитом
 * зрозуміти, чи все налаштовано:  GET /api/health
 */
export async function GET() {
  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    "";

  const missing: string[] = [];
  if (!raw) missing.push("DATABASE_URL");

  let provider = "";
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      provider = /neon\.tech$/i.test(host)
        ? "Neon"
        : /supabase/i.test(host)
          ? "Supabase"
          : /vercel-storage|vercel\.com/i.test(host)
            ? "Vercel Postgres"
            : /localhost|127\.0\.0\.1/i.test(host)
              ? "local"
              : "postgres";
    } catch {
      provider = "postgres";
    }
  }

  const result: any = {
    ok: false,
    database: { configured: !!raw, connected: false, provider, tables: 0 },
    optional: {
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    },
    missing,
    hint: "",
  };

  if (!raw) {
    result.hint = "Додайте DATABASE_URL у змінні середовища хостингу та зробіть Redeploy.";
    return NextResponse.json(result, { status: 200 });
  }

  try {
    const rows = await sql(
      `SELECT count(*)::int AS c FROM information_schema.tables WHERE table_schema = 'public'`
    );
    result.database.connected = true;
    result.database.tables = rows[0]?.c ?? 0;
    result.ok = true;
    result.hint = "Усе налаштовано.";
  } catch (e: any) {
    result.database.error = String(e?.message || e).slice(0, 200);
    result.hint = "DATABASE_URL задано, але підключення не вдалося. Перевірте рядок підключення (sslmode=require).";
  }

  return NextResponse.json(result, { status: 200 });
}
