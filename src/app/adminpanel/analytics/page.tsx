"use client";

import { useCallback, useEffect, useState } from "react";
import { api, useToast } from "@/components/admin/ui";
import { IconInbox, IconPhone, IconTrend, IconUsers } from "@/components/icons";

const PERIODS = [
  { id: "today", label: "Сьогодні" },
  { id: "week", label: "7 днів" },
  { id: "month", label: "30 днів" },
  { id: "quarter", label: "90 днів" },
  { id: "all", label: "Весь час" },
];

const DAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const EVENT_LABELS: Record<string, string> = {
  page_view: "Перегляд сторінки",
  section_view: "Перегляд блоку",
  scroll_depth: "Глибина прокрутки",
  time_on_page: "Час на сторінці",
  click_phone: "Клік «Подзвонити»",
  click_whatsapp: "Клік WhatsApp",
  click_viber: "Клік Viber",
  click_telegram: "Клік Telegram",
  cta_to_form: "Перехід до форми",
  view_bus: "Перегляд автобуса",
  click_order: "Клік «Замовити»",
  submit_application: "Заявка відправлена",
};
const SECTION_LABELS: Record<string, string> = {
  hero: "Перший екран", about: "Про компанію", buses: "Наш транспорт", services: "Послуги",
  why: "Чому обирають нас", how: "Як замовити", form: "Форма заявки", contacts: "Контакти",
};
const DEVICE_LABELS: Record<string, string> = { mobile: "Телефони", tablet: "Планшети", desktop: "Комп'ютери", unknown: "Невідомо" };

const label = (t: string) => EVENT_LABELS[t] || t;
const sectionLabel = (s: string) => SECTION_LABELS[s] || s;
const deviceLabel = (d: string) => DEVICE_LABELS[d] || d;

/** Простий стовпчиковий графік на SVG (без зовнішніх бібліотек). */
function Bars({ data, color = "#ff7a1a", height = 120 }: {
  data: { label: string; value: number; extra?: number }[];
  color?: string; height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <div className="a-muted" style={{ padding: 12 }}>Немає даних за період</div>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, overflowX: "auto", paddingBottom: 2 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: "1 0 auto", minWidth: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          title={`${d.label}: ${d.value}${d.extra ? ` (+${d.extra})` : ""}`}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{d.value || ""}</span>
          <div style={{ width: "100%", maxWidth: 26, height: Math.max(3, (d.value / max) * (height - 30)), background: color, borderRadius: 4 }} />
          <span style={{ fontSize: 9.5, color: "#94a3b8", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Горизонтальні смуги з підписами (для таблиць-рейтингів). */
function Rank({ items, color = "#2563eb", empty = "Немає даних" }: { items: { name: string; value: number }[]; color?: string; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <div className="a-muted">— {empty}</div>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i}>
          <div className="a-row a-row--between" style={{ fontSize: 13, marginBottom: 3 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
            <strong>{it.value}</strong>
          </div>
          <div style={{ height: 7, background: "#eef2f7", borderRadius: 6 }}>
            <div style={{ width: `${(it.value / max) * 100}%`, height: "100%", background: color, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async (p = period, f = from, t = to) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ period: p });
      if (f) qs.set("from", f);
      if (t) qs.set("to", t);
      setData(await api(`/api/admin/analytics?${qs.toString()}`));
    } catch (e: any) {
      toast(e.message);
    }
    setLoading(false);
  }, [period, from, to, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/admin/analytics?period=month");
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) toast(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const exportCsv = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    const qs = new URLSearchParams({ period, ...(from ? { from } : {}), ...(to ? { to } : {}) });
    const res = await fetch(`/api/admin/analytics/export?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { alert("Не вдалося експортувати"); return; }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const k = data?.kpi || {};
  const funnel = data?.funnel || {};
  const days = (data?.byDay || []).map((d: any) => ({ label: String(d.day).slice(5), value: d.views, extra: d.leads }));
  const hours = Array.from({ length: 24 }, (_, h) => ({
    label: h % 3 === 0 ? String(h) : "", value: (data?.byHour || []).find((x: any) => x.hour === h)?.count || 0,
  }));
  const dows = Array.from({ length: 7 }, (_, d) => ({ label: DAYS[d], value: (data?.byDow || []).find((x: any) => x.dow === d)?.count || 0 }));

  const kpis = [
    { label: "Перегляди", value: k.views ?? 0, icon: IconTrend, color: "#2563eb", sub: `сьогодні: ${k.views_today ?? 0}` },
    { label: "Унікальні сесії", value: k.sessions ?? 0, icon: IconUsers, color: "#0891b2", sub: `за тиждень: ${k.views_week ?? 0}` },
    { label: "Заявки", value: k.leads ?? 0, icon: IconInbox, color: "#16a34a", sub: `конверсія: ${k.conversion ?? 0}%` },
    { label: "Кліки «Подзвонити»", value: k.phone ?? 0, icon: IconPhone, color: "#d97706", sub: `WhatsApp: ${k.whatsapp ?? 0} · Viber: ${k.viber ?? 0} · TG: ${k.telegram ?? 0}` },
  ];

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Аналітика</h1>
          <p>Перегляди, сесії, кліки, переглянуті блоки, джерела трафіку та заявки. Дані збираються з сайту автоматично.</p>
        </div>
        <div className="a-row a-row--wrap">
          <button className="a-btn a-btn--gray a-btn--sm" onClick={() => load()}>Оновити</button>
          <button className="a-btn a-btn--navy a-btn--sm" onClick={exportCsv}>Експорт CSV</button>
        </div>
      </div>

      {/* період */}
      <div className="a-row a-row--wrap" style={{ gap: 8, marginBottom: 12 }}>
        {PERIODS.map((p) => (
          <button key={p.id} className="a-btn a-btn--sm"
            style={{ background: period === p.id && !from && !to ? "var(--a-navy)" : "#e6ebf2", color: period === p.id && !from && !to ? "#fff" : "#2b3b4e" }}
            onClick={() => { setFrom(""); setTo(""); setPeriod(p.id); load(p.id, "", ""); }}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="a-card" style={{ marginBottom: 18 }}>
        <div className="a-row a-row--wrap" style={{ gap: 10, alignItems: "flex-end" }}>
          <div className="a-field" style={{ marginBottom: 0 }}>
            <label>Від</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="a-field" style={{ marginBottom: 0 }}>
            <label>До</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="a-btn a-btn--primary a-btn--sm" onClick={() => load(period, from, to)}>Показати</button>
          {(from || to) && <button className="a-btn a-btn--gray a-btn--sm" onClick={() => { setFrom(""); setTo(""); load(period, "", ""); }}>Скинути</button>}
        </div>
      </div>

      {loading && !data ? <div className="a-empty">Завантаження...</div> : (
        <>
          {/* KPI */}
          <div className="a-grid a-grid--stats" style={{ marginBottom: 18 }}>
            {kpis.map((c) => {
              const C = c.icon;
              return (
                <div className="a-stat" key={c.label}>
                  <span className="a-stat__icon" style={{ color: c.color }}><C size={22} /></span>
                  <strong style={{ fontSize: 28 }}>{c.value}</strong>
                  <span>{c.label}</span>
                  <div className="a-muted" style={{ fontSize: 12, marginTop: 4 }}>{c.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="a-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px,100%), 1fr))", marginBottom: 18 }}>
            {/* динаміка */}
            <div className="a-card" style={{ gridColumn: "1 / -1" }}>
              <div className="a-between" style={{ marginBottom: 10 }}>
                <h3 style={{ fontSize: 16 }}>Перегляди та заявки по днях</h3>
                <span className="a-muted" style={{ fontSize: 12.5 }}>
                  тиждень до тижня: {k.weekChange == null ? "—" : `${k.weekChange > 0 ? "+" : ""}${k.weekChange}%`}
                </span>
              </div>
              <Bars data={days} height={150} />
            </div>

            {/* воронка */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Воронка</h3>
              <Rank color="#16a34a" items={[
                { name: "Відкрили сторінку", value: funnel.step_view || 0 },
                { name: "Перейшли до форми", value: funnel.step_form || 0 },
                { name: "Залишили заявку", value: funnel.step_lead || 0 },
              ]} />
              <div className="a-muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                Середній час на сторінці: <strong>{k.avg_time ?? 0} с</strong> · Переглядів автобусів: <strong>{k.bus_views ?? 0}</strong>
              </div>
            </div>

            {/* пристрої */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Пристрої</h3>
              <Rank color="#0891b2" items={(data?.devices || []).map((d: any) => ({ name: deviceLabel(d.device), value: d.sessions }))} />
            </div>

            {/* блоки */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Які блоки дивляться</h3>
              <Rank color="#7c3aed" items={(data?.sections || []).map((s: any) => ({ name: sectionLabel(s.section), value: s.count }))} />
            </div>

            {/* глибина прокрутки */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Глибина прокрутки</h3>
              <Rank color="#f59e0b" items={(data?.scroll || []).map((s: any) => ({ name: `${s.depth}% сторінки`, value: s.count }))} />
            </div>

            {/* години */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Активність по годинах</h3>
              <Bars data={hours} color="#2563eb" height={110} />
            </div>

            {/* дні тижня */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>По днях тижня</h3>
              <Bars data={dows} color="#16a34a" height={110} />
            </div>

            {/* автобуси */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Популярні автобуси</h3>
              <Rank color="#ff7a1a" items={(data?.topBuses || []).map((b: any) => ({ name: b.name, value: b.views }))} empty="Ще не дивились" />
            </div>

            {/* джерела */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Джерела (UTM)</h3>
              <Rank color="#0d9488" items={(data?.sources || []).map((s: any) => ({
                name: `${s.source} / ${s.medium}${s.campaign !== "-" ? ` / ${s.campaign}` : ""}`, value: s.count,
              }))} empty="Трафік без міток" />
            </div>

            {/* реферери */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Звідки прийшли</h3>
              <Rank color="#64748b" items={(data?.referrers || []).map((r: any) => ({ name: r.referrer.slice(0, 40), value: r.count }))} />
            </div>

            {/* заявки */}
            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Заявки за статусами</h3>
              <Rank color="#16a34a" items={(data?.appStatus || []).map((s: any) => ({ name: s.status, value: s.count }))} empty="Заявок ще немає" />
            </div>

            <div className="a-card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Заявки за транспортом</h3>
              <Rank color="#2563eb" items={(data?.appByBus || []).map((s: any) => ({ name: s.name, value: s.count }))} empty="Заявок ще немає" />
            </div>
          </div>

          {/* детальна статистика подій */}
          <div className="a-card" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Детальна статистика подій</h3>
            <div className="a-tablewrap">
              <table className="a-table">
                <thead><tr><th>Подія</th><th>Кількість</th></tr></thead>
                <tbody>
                  {(data?.byType || []).map((t: any) => (
                    <tr key={t.event_type}><td>{label(t.event_type)}</td><td><strong>{t.count}</strong></td></tr>
                  ))}
                  {!(data?.byType || []).length && <tr><td colSpan={2} className="a-muted">Немає подій за період</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* останні події */}
          <div className="a-card">
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Останні події</h3>
            <div className="a-tablewrap">
              <table className="a-table">
                <thead><tr><th>Час</th><th>Подія</th><th>Деталі</th><th>Пристрій</th></tr></thead>
                <tbody>
                  {(data?.recent || []).map((e: any, i: number) => (
                    <tr key={i}>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString("uk-UA") : ""}</td>
                      <td>{label(e.event_type)}</td>
                      <td>{e.event_data || "—"}</td>
                      <td>{deviceLabel(e.device)}</td>
                    </tr>
                  ))}
                  {!(data?.recent || []).length && <tr><td colSpan={4} className="a-muted">Немає подій</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
