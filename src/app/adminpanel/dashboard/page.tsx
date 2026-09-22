"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, IconArrowRight, IconBus, IconCheck, IconInbox, IconLayers, IconStar, IconTrend } from "@/components/icons";
import { api } from "@/components/admin/ui";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [buses, services, apps, types, items, advantages, steps] = await Promise.all([
          api("/api/admin/content/buses"),
          api("/api/admin/content/services"),
          api("/api/admin/content/applications"),
          api("/api/admin/content/types"),
          api("/api/admin/content/items"),
          api("/api/admin/content/advantages"),
          api("/api/admin/content/steps"),
        ]);
        setStats({
          buses: buses.length,
          busesActive: buses.filter((b: any) => b.active !== false).length,
          services: services.length,
          apps: apps.length,
          appsNew: apps.filter((a: any) => a.status === "new").length,
          types: types.length,
          items: items.length,
          advantages: advantages.length,
          steps: steps.length,
        });
        setRecent(apps.slice(0, 5));
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, []);

  const cards = [
    { label: "Автобусів у каталозі", value: stats?.buses, sub: `${stats?.busesActive ?? 0} активних`, icon: IconBus, href: "/adminpanel/buses" },
    { label: "Заявок всього", value: stats?.apps, sub: `${stats?.appsNew ?? 0} нових`, icon: IconInbox, href: "/adminpanel/applications" },
    { label: "Послуг", value: stats?.services, sub: "блок «Наші послуги»", icon: IconLayers, href: "/adminpanel/services" },
    { label: "Переваг", value: stats?.advantages, sub: "блок «Чому ми»", icon: IconStar, href: "/adminpanel/advantages" },
    { label: "Кроків замовлення", value: stats?.steps, sub: "блок «Як замовити»", icon: IconTrend, href: "/adminpanel/steps" },
    { label: "Універсальних блоків", value: stats?.types, sub: `${stats?.items ?? 0} елементів`, icon: IconLayers, href: "/adminpanel/builder" },
  ];

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Дашборд</h1>
          <p>Загальний огляд сайту: каталог, контент і заявки. Усі дані зберігаються у зовнішній базі PostgreSQL.</p>
        </div>
      </div>

      <div className="a-grid a-grid--stats">
        {cards.map((c) => {
          const C = c.icon;
          return (
            <button key={c.label} className="a-stat" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--a-line)" }}
              onClick={() => router.push(c.href)}>
              <span className="a-stat__icon"><C size={22} /></span>
              <strong>{c.value ?? "—"}</strong>
              <span>{c.label}</span>
              <div className="a-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{c.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="a-card" style={{ marginTop: 22 }}>
        <div className="a-between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 17 }}>Останні заявки</h3>
          <button className="a-btn a-btn--ghost a-btn--sm" onClick={() => router.push("/adminpanel/applications")}>
            Усі заявки <IconArrowRight size={15} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="a-empty" style={{ padding: "30px 10px" }}>
            <div className="a-empty__icon"><IconInbox size={26} /></div>
            Поки немає заявок
          </div>
        ) : (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr><th>Ім’я</th><th>Телефон</th><th>Транспорт</th><th>Маршрут</th><th>Статус</th><th>Дата</th></tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.phone}</td>
                    <td>{a.bus || "—"}</td>
                    <td>{a.route || "—"}</td>
                    <td><span className={`a-badge ${a.status === "new" ? "a-badge--info" : "a-badge--on"}`}>{a.status}</span></td>
                    <td>{a.created_at ? new Date(a.created_at).toLocaleString("uk-UA") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="a-card" style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "center" }}>
        <span className="a-stat__icon" style={{ marginBottom: 0 }}><Icon name="settings" size={22} /></span>
        <div style={{ flex: 1 }}>
          <strong>Готово до редагування</strong>
          <div className="a-muted">Змініть телефони, тексти, ціни, фото та кількість блоків без програміста — у розділах ліворуч.</div>
        </div>
        <button className="a-btn a-btn--navy" onClick={() => router.push("/adminpanel/settings")}><IconCheck size={16} /> Налаштування</button>
      </div>
    </div>
  );
}
