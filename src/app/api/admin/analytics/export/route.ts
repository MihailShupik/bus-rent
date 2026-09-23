import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureInitialized } from "@/lib/content";

export const dynamic = "force-dynamic";

/** Експорт подій аналітики у CSV (за періодом). */
export async function GET(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureInitialized();
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "month";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    let where = "";
    const params: any[] = [];
    const interval: Record<string, string> = {
      today: "1 day", week: "7 days", month: "30 days", quarter: "90 days", year: "365 days",
    };
    if (from || to) {
      if (from) { params.push(from); where += ` AND created_at >= $${params.length}::date`; }
      if (to) { params.push(to); where += ` AND created_at < ($${params.length}::date + INTERVAL '1 day')`; }
    } else if (interval[period]) {
      where += ` AND created_at >= NOW() - INTERVAL '${interval[period]}'`;
    }

    const rows = await sql(
      `SELECT created_at, event_type, event_data, value, device, screen, session_id,
              page_url, referrer, utm_source, utm_medium, utm_campaign, ip_address
       FROM analytics_events WHERE 1=1 ${where} ORDER BY id DESC LIMIT 20000`,
      params
    );

    const head = ["Час", "Подія", "Деталі", "Значення", "Пристрій", "Екран", "Сесія", "Сторінка", "Реферер", "utm_source", "utm_medium", "utm_campaign", "IP"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r: any) => [
      r.created_at ? new Date(r.created_at).toISOString() : "",
      r.event_type, r.event_data, r.value, r.device, r.screen, r.session_id,
      r.page_url, r.referrer, r.utm_source, r.utm_medium, r.utm_campaign, r.ip_address,
    ].map(esc).join(","));

    const csv = "\uFEFF" + [head.join(","), ...lines].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${period}.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
