"use client";

import { useCallback, useEffect, useState } from "react";
import { api, useToast } from "@/components/admin/ui";
import { Icon, IconCheck, IconClose, IconSettings } from "@/components/icons";

const TABLE_LABELS: Record<string, string> = {
  admin_users: "Адміністратори панелі",
  site_settings: "Налаштування",
  buses: "Автобуси",
  services: "Послуги",
  advantages: "Переваги",
  steps: "Кроки замовлення",
  applications: "Заявки",
  analytics_events: "Події аналітики",
  media: "Зображення",
  content_types: "Типи блоків",
  content_items: "Елементи блоків",
  telegram_admins: "Адміністратори бота",
};

export default function SystemPage() {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api("/api/admin/system");
      setData(res);
    } catch (e: any) {
      toast(e.message);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/admin/system");
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) toast(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const run = async (action: string, label: string) => {
    setBusy(action);
    try {
      const res = await api("/api/admin/system", { method: "POST", body: JSON.stringify({ action }) });
      toast(res.message || `${label}: готово`);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
    setBusy("");
  };

  const db = data?.database;
  const env = data?.env || {};
  const tables = data?.tables || {};

  const badge = (ok: boolean, okText = "налаштовано", badText = "немає") => (
    <span className={`a-badge ${ok ? "a-badge--on" : "a-badge--off"}`}>
      {ok ? <IconCheck size={12} /> : <IconClose size={12} />} {ok ? okText : badText}
    </span>
  );

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Стан системи</h1>
          <p>
            Перевірка зовнішньої бази даних, змінних середовища та інтеграцій. Корисно одразу після
            деплою на Vercel: видно, до якої бази підключено застосунок і чи все заповнено.
          </p>
        </div>
        <button className="a-btn a-btn--gray" onClick={load}>Оновити</button>
      </div>

      {/* ------------------------------- database ------------------------------ */}
      <div className="a-card" style={{ marginBottom: 18 }}>
        <div className="a-between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 16 }}>База даних</h3>
          {data?.connected
            ? <span className="a-badge a-badge--on"><IconCheck size={12} /> підключено{data.latencyMs != null ? ` · ${data.latencyMs} мс` : ""}</span>
            : <span className="a-badge a-badge--off"><IconClose size={12} /> немає зв’язку</span>}
        </div>

        <div className="a-grid a-grid--stats">
          <div className="a-stat">
            <span className="a-stat__icon"><Icon name="world" size={22} /></span>
            <strong style={{ fontSize: 18 }}>{db?.provider || "-"}</strong>
            <span>Провайдер (поза нашим сервером)</span>
            <div className="a-muted" style={{ fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>
              {db?.host || "-"}{db?.database ? ` / ${db.database}` : ""}
            </div>
          </div>

          <div className="a-stat">
            <span className="a-stat__icon"><IconSettings size={22} /></span>
            <strong style={{ fontSize: 18 }}>{data?.server || "-"}</strong>
            <span>Версія PostgreSQL</span>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {db?.pooled && <span className="a-badge a-badge--info">pooled</span>}
              {db?.ssl && <span className="a-badge a-badge--info">SSL</span>}
            </div>
          </div>

          <div className="a-stat">
            <span className="a-stat__icon"><Icon name="layers" size={22} /></span>
            <strong style={{ fontSize: 18 }}>{Object.values(tables).filter((v: any) => v >= 0).length}</strong>
            <span>таблиць у базі</span>
            <div className="a-muted" style={{ fontSize: 12, marginTop: 6 }}>
              Node {data?.runtime?.node} · {data?.runtime?.env}
            </div>
          </div>
        </div>

        {data?.error && <div className="a-error" style={{ marginTop: 14 }}>{data.error}</div>}

        <div className="a-row a-row--wrap" style={{ gap: 10, marginTop: 16 }}>
          <button className="a-btn a-btn--navy a-btn--sm" disabled={busy === "init-schema"} onClick={() => run("init-schema", "Схема")}>
            {busy === "init-schema" ? "..." : "Перевірити / створити схему"}
          </button>
          <button className="a-btn a-btn--gray a-btn--sm" disabled={busy === "seed"} onClick={() => run("seed", "Контент")}>
            Наповнити стартовим контентом
          </button>
        </div>
      </div>

      {/* -------------------------------- tables ------------------------------- */}
      <div className="a-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Записи в таблицях</h3>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead><tr><th>Таблиця</th><th>Призначення</th><th>Записів</th></tr></thead>
            <tbody>
              {Object.entries(tables).map(([t, c]: any) => (
                <tr key={t}>
                  <td><code>{t}</code></td>
                  <td>{TABLE_LABELS[t] || "-"}</td>
                  <td>{c < 0 ? "немає таблиці" : c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------- env -------------------------------- */}
      <div className="a-card">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Змінні середовища та інтеграції</h3>
        <div className="a-grid" style={{ gap: 10 }}>
          {[
            ["DATABASE_URL", env.DATABASE_URL, "зовнішня база даних (Neon/Supabase/Vercel Postgres)"],
            ["JWT_SECRET", env.JWT_SECRET, "підпис токенів адмінки"],
            ["ADMIN_EMAIL", env.ADMIN_EMAIL, "логін адміністратора"],
            ["ADMIN_PASSWORD", env.ADMIN_PASSWORD, "пароль адміністратора"],
            ["TELEGRAM_BOT_TOKEN", env.TELEGRAM_BOT_TOKEN, "токен бота"],
            ["TELEGRAM_CHAT_ID", env.TELEGRAM_CHAT_ID, "додатковий чат (необов'язково)"],
            ["NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL, "публічна адреса для webhook (необов'язково)"],
          ].map(([key, ok, hint]: any) => (
            <div key={key} className="a-row a-row--between" style={{ gap: 10, padding: "8px 0", borderBottom: "1px solid var(--a-line)" }}>
              <div>
                <code style={{ fontSize: 13 }}>{key}</code>
                <div className="a-muted" style={{ fontSize: 12 }}>{hint}</div>
              </div>
              {badge(!!ok)}
            </div>
          ))}
          <div className="a-row a-row--between" style={{ gap: 10, padding: "8px 0" }}>
            <div>
              <strong style={{ fontSize: 13.5 }}>Telegram-бот</strong>
              <div className="a-muted" style={{ fontSize: 12 }}>
                {data?.telegram?.configured
                  ? `джерело токена: ${data.telegram.source === "env" ? "змінна середовища" : "база даних"}`
                  : "токен не налаштовано"}
              </div>
            </div>
            {data?.telegram?.configured
              ? <span className="a-badge a-badge--on"><IconCheck size={12} /> @{data.telegram.bot || "bot"}</span>
              : <span className="a-badge a-badge--off">немає</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
