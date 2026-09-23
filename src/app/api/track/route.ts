import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** Визначає тип пристрою з User-Agent. */
function detectDevice(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  if (!ua) return "unknown";
  return "desktop";
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    const ua = request.headers.get("user-agent") || "";
    await sql(
      `INSERT INTO analytics_events
        (event_type, event_data, page_url, referrer, utm_source, utm_medium, utm_campaign,
         user_agent, ip_address, session_id, device, screen, value)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        clip(b.event_type || "unknown", 100),
        clip(b.event_data, 500),
        clip(b.page_url, 800),
        clip(b.referrer, 800),
        clip(b.utm_source, 120),
        clip(b.utm_medium, 120),
        clip(b.utm_campaign, 120),
        clip(ua, 500),
        clip((request.headers.get("x-forwarded-for") || "").split(",")[0], 60),
        clip(b.session_id, 60),
        detectDevice(ua),
        clip(b.screen, 20),
        Number.isFinite(+b.value) ? Math.round(+b.value) : 0,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
