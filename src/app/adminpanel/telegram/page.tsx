"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ResourceManager, useToast, type FieldDef } from "@/components/admin/ui";
import { Icon, IconCheck, IconInbox, IconSend, IconUsers } from "@/components/icons";

type AdminRow = { id: number; name: string; telegram_id: string; role: string; active: boolean };

const fields: FieldDef[] = [
  { key: "name", label: "Ім'я адміністратора", type: "text", placeholder: "Ігор" },
  { key: "telegram_id", label: "Telegram ID", type: "text", placeholder: "899837838", hint: "Дізнатись ID: надішліть боту команду /id" },
  { key: "role", label: "Роль", type: "text", placeholder: "адміністратор" },
  { key: "active", label: "Отримує заявки", type: "bool" },
];

export default function TelegramAdmin() {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const data = await api("/api/admin/telegram");
      setStatus(data);
    } catch (e: any) {
      toast(e.message);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/admin/telegram");
        if (!cancelled) setStatus(data);
      } catch (e: any) {
        if (!cancelled) toast(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const run = async (action: string, extra: Record<string, any> = {}) => {
    setBusy(action);
    setTestResults(null);
    try {
      const res = await api("/api/admin/telegram", { method: "POST", body: JSON.stringify({ action, ...extra }) });
      if (action === "test") {
        setTestResults(res.results || []);
        toast(res.delivered ? `Надіслано: ${res.delivered} з ${res.total}` : "Не вдалося надіслати");
      } else if (action === "set-webhook") {
        toast(res.success ? "Webhook підключено" : `Помилка: ${res.telegram?.description || ""}`);
      } else if (action === "delete-webhook") {
        toast(res.success ? "Webhook відключено" : "Помилка");
      } else if (action === "save-token") {
        toast(res.success ? "Токен збережено" : "Помилка");
        setTokenInput("");
      }
      await load();
    } catch (e: any) {
      alert(e.message);
    }
    setBusy("");
  };

  const bot = status?.bot?.result;
  const webhook = status?.webhook?.result;
  const webhookConnected = !!webhook?.url;

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Telegram-бот</h1>
          <p>
            Бот надсилає заявки з сайту всім адміністраторам зі списку нижче. Адміністраторів можна додавати,
            редагувати, приховувати та видаляти. Кожен адміністратор має один раз натиснути <b>Start</b> у боті -
            інакше Telegram не дозволяє надсилати йому повідомлення.
          </p>
        </div>
        <button className="a-btn a-btn--gray" onClick={load}>Оновити статус</button>
      </div>

      {/* ------------------------------- status ------------------------------- */}
      <div className="a-grid a-grid--stats" style={{ marginBottom: 18 }}>
        <div className="a-stat">
          <span className="a-stat__icon"><Icon name="send" size={22} /></span>
          <strong style={{ fontSize: 18 }}>{bot ? bot.first_name || "Бот" : "-"}</strong>
          <span>{bot?.username ? "@" + bot.username : "не підключено"}</span>
          <div style={{ marginTop: 8 }}>
            {status?.configured
              ? <span className="a-badge a-badge--on"><IconCheck size={12} /> токен працює</span>
              : <span className="a-badge a-badge--off">токен не задано</span>}
          </div>
        </div>

        <div className="a-stat">
          <span className="a-stat__icon"><IconInbox size={22} /></span>
          <strong style={{ fontSize: 18 }}>Заявки з сайту</strong>
          <span>надходять адміністраторам</span>
          <div style={{ marginTop: 8 }}>
            {status?.leadsAlwaysWork
              ? <span className="a-badge a-badge--on"><IconCheck size={12} /> працює без webhook</span>
              : <span className="a-badge a-badge--off">немає токена</span>}
          </div>
        </div>

        <div className="a-stat">
          <span className="a-stat__icon"><Icon name="world" size={22} /></span>
          <strong style={{ fontSize: 18 }}>{webhookConnected ? "Працюють" : "Не налаштовано"}</strong>
          <span>команди бота (webhook)</span>
          <div style={{ marginTop: 8 }}>
            {webhookConnected
              ? <span className="a-badge a-badge--on">Telegram → сайт</span>
              : <span className="a-badge a-badge--off">лише через webhook або polling</span>}
          </div>
        </div>

        <div className="a-stat">
          <span className="a-stat__icon"><IconUsers size={22} /></span>
          <strong style={{ fontSize: 18 }}>{(status?.admins || []).filter((a: AdminRow) => a.active !== false).length}</strong>
          <span>активних адміністраторів</span>
          <div className="a-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            всього: {(status?.admins || []).length}
          </div>
        </div>
      </div>

      {status?.autoWebhook?.ok && (
        <div className="a-hint" style={{ marginBottom: 18 }}>
          <b>Webhook підключено автоматично.</b> Зареєстровано адресу <code>{status.autoWebhook.url}</code> -
          команди бота вже працюють. Більше нічого робити не потрібно.
        </div>
      )}
      {status?.autoWebhook && !status.autoWebhook.ok && (
        <div className="a-error" style={{ marginBottom: 18 }}>
          Не вдалося автоматично підключити webhook: {status.autoWebhook.error}. Скористайтесь кнопкою нижче.
        </div>
      )}
      {!status?.isPublicHttps && status?.configured && (
        <div className="a-hint" style={{ marginBottom: 18 }}>
          Локальний запуск: Telegram не може достукатись до <code>localhost</code>. Заявки працюють,
          а команди перевіряйте через <code>node scripts/telegram-poll.mjs</code>. У хмарі (Vercel, HTTPS)
          webhook підключиться автоматично.
        </div>
      )}

      {/* ------------------------------- actions ------------------------------ */}
      <div className="a-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Керування ботом</h3>

        <div className="a-field">
          <label>Адреса webhook</label>
          <div className="a-list__row">
            <input value={status?.webhookUrl || ""} readOnly />
            <button className="a-btn a-btn--navy a-btn--sm" disabled={!status?.configured || busy === "set-webhook"} onClick={() => run("set-webhook")}>
              {busy === "set-webhook" ? "..." : "Підключити"}
            </button>
            <button className="a-btn a-btn--gray a-btn--sm" disabled={!status?.configured || busy === "delete-webhook"} onClick={() => run("delete-webhook")}>
              Відключити
            </button>
          </div>
          <small>
            {webhookConnected
              ? `Поточний webhook: ${webhook.url}`
              : "Підключіть webhook, щоб бот відповідав на команди /id, /leads, /stats."}
            {webhook?.last_error_message ? ` Остання помилка: ${webhook.last_error_message}` : ""}
          </small>
        </div>

        <div className="a-row a-row--wrap" style={{ gap: 10, marginTop: 6 }}>
          <button className="a-btn a-btn--primary" disabled={!status?.configured || busy === "test"} onClick={() => run("test")}>
            <IconSend size={16} /> {busy === "test" ? "Надсилаю..." : "Надіслати тест усім адмінам"}
          </button>
          <a className="a-btn a-btn--ghost" href="https://t.me/bussite_bot" target="_blank" rel="noreferrer">
            Відкрити бота в Telegram
          </a>
        </div>

        {testResults && (
          <div style={{ marginTop: 14 }}>
            {testResults.map((r) => (
              <div key={r.id} className="a-row a-row--wrap" style={{ gap: 8, padding: "6px 0", fontSize: 13.5 }}>
                <span className={`a-badge ${r.ok ? "a-badge--on" : "a-badge--off"}`}>{r.ok ? "доставлено" : "не доставлено"}</span>
                <strong>{r.name || "-"}</strong>
                <span className="a-muted">{r.id}</span>
                {!r.ok && <span className="a-muted">- {r.error}. Хай адміністратор натисне Start у боті.</span>}
              </div>
            ))}
          </div>
        )}

        {!status?.configured && (
          <div className="a-field" style={{ marginTop: 16 }}>
            <label>Токен бота</label>
            <div className="a-list__row">
              <input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="8881951039:AA..."
                type="text"
              />
              <button className="a-btn a-btn--green a-btn--sm" disabled={!tokenInput.trim() || busy === "save-token"} onClick={() => run("save-token", { token: tokenInput })}>
                Зберегти
              </button>
            </div>
            <small>Отримати токен: @BotFather → /newbot. Токен можна також задати змінною середовища TELEGRAM_BOT_TOKEN.</small>
          </div>
        )}

        {status?.tokenFromEnv && (
          <div className="a-hint" style={{ marginTop: 14 }}>
            Токен задано змінною середовища <strong>TELEGRAM_BOT_TOKEN</strong> - він має приоритет і змінюється на хостингу.
          </div>
        )}
      </div>

      {/* --------------------------- how to add admin -------------------------- */}
      <div className="a-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>Як додати адміністратора</h3>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: "#33475e" }}>
          <li>Адміністратор відкриває бота <b>@bussite_bot</b> і натискає <b>Start</b>.</li>
          <li>Надсилає команду <code>/id</code> - бот відповідає його Telegram ID.</li>
          <li>Тут, у списку нижче, натискаємо <b>«Додати адміністратора»</b> і вписуємо ім’я та цей ID.</li>
          <li>Натискаємо «Надіслати тест усім адмінам» - перевіряємо, що повідомлення дійшло.</li>
        </ol>
      </div>

      {/* ---------------------------- admins list ----------------------------- */}
      <ResourceManager
        type="telegram-admins"
        title="Адміністратори бота"
        description="Хто отримує заявки з сайту та має доступ до команд /leads і /stats. Можна приховувати без видалення."
        addLabel="Додати адміністратора"
        fields={fields}
        primaryKey="name"
        secondaryKey="telegram_id"
        searchKeys={["name", "telegram_id"]}
        defaults={{ name: "", telegram_id: "", role: "адміністратор", active: true }}
      />
    </div>
  );
}
