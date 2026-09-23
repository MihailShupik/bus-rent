import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureInitialized } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * Повна статистика сайту: перегляди, унікальні сесії, кліки, блоки, джерела,
 * пристрої, воронка та заявки. Період: today | week | month | quarter | year | all
 * або власний діапазон from/to (YYYY-MM-DD).
 */
export async function GET(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureInitialized();
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "month";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    // --- фільтр періоду (параметризовано)
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

    const q = (query: string, extra: any[] = []) => sql(query, [...params, ...extra]);
    const appWhere = where.replace(/created_at/g, "applications.created_at");

    const [
      kpi, byDay, byHour, byDow, byType, topBuses, appStatus, appByBus, appsByDay,
      sources, referrers, devices, sections, scroll, recent, funnel,
    ] = await Promise.all([
      q(`SELECT
           COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS views,
           COUNT(DISTINCT NULLIF(session_id,''))::int AS sessions,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= CURRENT_DATE)::int AS views_today,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= DATE_TRUNC('week', NOW()))::int AS views_week,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days' AND created_at < DATE_TRUNC('week', NOW()))::int AS views_prev_week,
           COUNT(*) FILTER (WHERE event_type = 'submit_application')::int AS leads,
           COUNT(*) FILTER (WHERE event_type = 'click_phone')::int AS phone,
           COUNT(*) FILTER (WHERE event_type = 'click_whatsapp')::int AS whatsapp,
           COUNT(*) FILTER (WHERE event_type = 'click_viber')::int AS viber,
           COUNT(*) FILTER (WHERE event_type = 'click_telegram')::int AS telegram,
           COUNT(*) FILTER (WHERE event_type = 'view_bus')::int AS bus_views,
           ROUND(AVG(value) FILTER (WHERE event_type = 'time_on_page'))::int AS avg_time
         FROM analytics_events WHERE 1=1 ${where}`),

      q(`SELECT DATE(created_at)::text AS day,
                COUNT(*) FILTER (WHERE event_type='page_view')::int AS views,
                COUNT(*) FILTER (WHERE event_type='submit_application')::int AS leads
         FROM analytics_events WHERE 1=1 ${where}
         GROUP BY 1 ORDER BY 1 ASC`),

      q(`SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
         FROM analytics_events WHERE event_type='page_view' ${where}
         GROUP BY 1 ORDER BY 1 ASC`),

      q(`SELECT EXTRACT(DOW FROM created_at)::int AS dow, COUNT(*)::int AS count
         FROM analytics_events WHERE event_type='page_view' ${where}
         GROUP BY 1 ORDER BY 1 ASC`),

      q(`SELECT event_type, COUNT(*)::int AS count
         FROM analytics_events WHERE 1=1 ${where}
         GROUP BY 1 ORDER BY count DESC`),

      q(`SELECT event_data AS name,
                COUNT(*) FILTER (WHERE event_type='view_bus')::int AS views,
                COUNT(*) FILTER (WHERE event_type='click_order')::int AS orders
         FROM analytics_events
         WHERE event_type IN ('view_bus','click_order') ${where}
         GROUP BY 1 ORDER BY views DESC, orders DESC LIMIT 20`),

      q(`SELECT status, COUNT(*)::int AS count FROM applications GROUP BY 1 ORDER BY count DESC`),

      q(`SELECT COALESCE(NULLIF(bus,''),'(не вказано)') AS name, COUNT(*)::int AS count
         FROM applications WHERE 1=1 ${appWhere} GROUP BY 1 ORDER BY count DESC LIMIT 20`),

      q(`SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
         FROM applications WHERE 1=1 ${appWhere} GROUP BY 1 ORDER BY 1 ASC`),

      q(`SELECT COALESCE(NULLIF(utm_source,''),'прямий') AS source,
                COALESCE(NULLIF(utm_medium,''),'-') AS medium,
                COALESCE(NULLIF(utm_campaign,''),'-') AS campaign,
                COUNT(*)::int AS count
         FROM analytics_events WHERE 1=1 ${where}
         GROUP BY 1,2,3 ORDER BY count DESC LIMIT 25`),

      q(`SELECT COALESCE(NULLIF(referrer,''),'(прямий захід)') AS referrer, COUNT(*)::int AS count
         FROM analytics_events WHERE event_type='page_view' ${where}
         GROUP BY 1 ORDER BY count DESC LIMIT 12`),

      q(`SELECT COALESCE(NULLIF(device,''),'unknown') AS device,
                COUNT(DISTINCT NULLIF(session_id,''))::int AS sessions, COUNT(*)::int AS events
         FROM analytics_events WHERE 1=1 ${where} GROUP BY 1 ORDER BY sessions DESC`),

      q(`SELECT event_data AS section, COUNT(*)::int AS count
         FROM analytics_events WHERE event_type='section_view' ${where}
         GROUP BY 1 ORDER BY count DESC`),

      q(`SELECT value AS depth, COUNT(*)::int AS count
         FROM analytics_events WHERE event_type='scroll_depth' ${where}
         GROUP BY 1 ORDER BY 1 ASC`),

      q(`SELECT event_type, event_data, device, created_at
         FROM analytics_events WHERE 1=1 ${where} ORDER BY id DESC LIMIT 25`),

      q(`SELECT
           COUNT(*) FILTER (WHERE event_type='page_view')::int AS step_view,
           COUNT(*) FILTER (WHERE event_type='cta_to_form')::int AS step_form,
           COUNT(*) FILTER (WHERE event_type='submit_application')::int AS step_lead
         FROM analytics_events WHERE 1=1 ${where}`),
    ]);

    const k = kpi[0] || {};
    const conversion = k.views ? Math.round((k.leads / k.views) * 1000) / 10 : 0;
    const weekChange = k.views_prev_week ? Math.round(((k.views_week - k.views_prev_week) / k.views_prev_week) * 100) : null;

    return NextResponse.json({
      period, from, to,
      kpi: { ...k, conversion, weekChange },
      byDay, byHour, byDow, byType, topBuses, appStatus, appByBus, appsByDay,
      sources, referrers, devices, sections, scroll, recent, funnel: funnel[0] || {},
    });
  } catch (e: any) {
    console.error("Analytics API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
