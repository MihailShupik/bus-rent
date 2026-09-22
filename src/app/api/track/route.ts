import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const b = await request.json();
    await sql(
      `INSERT INTO analytics_events (event_type, event_data, page_url, referrer, utm_source, utm_medium, utm_campaign, user_agent, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        String(b.event_type || "unknown").slice(0, 100),
        String(b.event_data || "").slice(0, 500),
        String(b.page_url || "").slice(0, 800),
        String(b.referrer || "").slice(0, 800),
        String(b.utm_source || "").slice(0, 120),
        String(b.utm_medium || "").slice(0, 120),
        String(b.utm_campaign || "").slice(0, 120),
        (request.headers.get("user-agent") || "").slice(0, 500),
        (request.headers.get("x-forwarded-for") || "").split(",")[0].slice(0, 60),
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
