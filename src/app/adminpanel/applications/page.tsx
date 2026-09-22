"use client";

import { useEffect, useState } from "react";
import { api, useAsyncData, useToast } from "@/components/admin/ui";
import { IconInbox, IconPhone, IconTrash } from "@/components/icons";

type StatusDef = { value: string; label: string };

const DEFAULT_STATUSES: StatusDef[] = [
  { value: "new", label: "Нова" },
  { value: "contacted", label: "Зв'язались" },
  { value: "calculated", label: "Розрахунок надіслано" },
  { value: "booked", label: "Підтверджено" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Скасовано" },
];

const COLORS: Record<string, string> = {
  new: "#2563eb", contacted: "#d97706", calculated: "#7c3aed",
  booked: "#0891b2", completed: "#16a34a", cancelled: "#dc2626",
};

export default function ApplicationsAdmin() {
  const { data: apps, setData: setApps, loading, reload: load } = useAsyncData<any[]>(
    () => api("/api/admin/content/applications").then((d) => (Array.isArray(d) ? d : [])),
    []
  );
  const [statuses, setStatuses] = useState<StatusDef[]>(DEFAULT_STATUSES);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await api("/api/admin/content/settings");
        const row = (rows || []).find((r: any) => r.key === "application_statuses");
        if (row?.value && !cancelled) {
          const parsed = JSON.parse(row.value);
          if (Array.isArray(parsed) && parsed.length) setStatuses(parsed);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const persistStatuses = async (next: StatusDef[]) => {
    setStatuses(next);
    try {
      await api("/api/admin/content/settings", { method: "POST", body: JSON.stringify([{ key: "application_statuses", value: JSON.stringify(next) }]) });
    } catch (e: any) { toast(e.message); }
  };

  const addStatus = () => {
    const label = newLabel.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (statuses.some((s) => s.value === value)) return;
    persistStatuses([...statuses, { value, label }]);
    setNewLabel("");
  };

  const changeStatus = async (id: number, status: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await api("/api/admin/content/applications", { method: "PUT", body: JSON.stringify({ id, status }) });
    } catch (e: any) { toast(e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm("Видалити заявку?")) return;
    try {
      await api(`/api/admin/content/applications?id=${id}`, { method: "DELETE" });
      setApps((prev) => prev.filter((a) => a.id !== id));
      toast("Видалено");
    } catch (e: any) { toast(e.message); }
  };

  const exportCsv = () => {
    const head = ["id", "created_at", "name", "phone", "email", "bus", "route", "passengers", "message", "status"];
    const rows = apps.map((a) => head.map((h) => `"${String(a[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [head.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = (s: string) => statuses.find((x) => x.value === s)?.label || s;
  const color = (s: string) => COLORS[s] || "#64748b";
  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  if (loading) return <div className="a-empty">Завантаження...</div>;

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Заявки</h1>
          <p>Всі заявки з форми сайту. Змінюйте статус, телефонуйте або експортуйте у CSV.</p>
        </div>
        <div className="a-row a-row--wrap">
          <button className="a-btn a-btn--gray" onClick={load}>Оновити</button>
          <button className="a-btn a-btn--navy" onClick={exportCsv}>Експорт CSV</button>
        </div>
      </div>

      <div className="a-row a-row--wrap" style={{ gap: 8, marginBottom: 14 }}>
        <button className="a-btn a-btn--sm" style={{ background: filter === "all" ? "var(--a-navy)" : "#e6ebf2", color: filter === "all" ? "#fff" : "#2b3b4e" }} onClick={() => setFilter("all")}>
          Всі ({apps.length})
        </button>
        {statuses.map((s) => (
          <button key={s.value} className="a-btn a-btn--sm"
            style={{ background: filter === s.value ? color(s.value) : "#e6ebf2", color: filter === s.value ? "#fff" : "#2b3b4e" }}
            onClick={() => setFilter(s.value)}>
            {s.label} ({apps.filter((a) => a.status === s.value).length})
          </button>
        ))}
      </div>

      <div className="a-card" style={{ marginBottom: 18 }}>
        <div className="a-row a-row--wrap">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Новий статус (напр. «Надіслано рахунок»)"
            style={{ padding: "10px 13px", borderRadius: 10, border: "1.5px solid var(--a-line)", flex: 1, minWidth: 220 }}
            onKeyDown={(e) => e.key === "Enter" && addStatus()} />
          <button className="a-btn a-btn--green a-btn--sm" onClick={addStatus}>Додати статус</button>
          <div className="a-row a-row--wrap" style={{ gap: 6 }}>
            {statuses.map((s) => (
              <span key={s.value} className="a-muted" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef3f9", padding: "4px 10px", borderRadius: 999, fontSize: 12.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color(s.value), display: "inline-block" }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="a-card a-empty">
          <div className="a-empty__icon"><IconInbox size={28} /></div>
          <p>Немає заявок у цій категорії</p>
        </div>
      ) : (
        <div className="a-grid" style={{ gap: 12 }}>
          {filtered.map((a) => (
            <div className="a-card" key={a.id} style={{ borderLeft: `4px solid ${color(a.status)}`, padding: 16 }}>
              <div className="a-between" style={{ cursor: "pointer" }} onClick={() => setOpen(open === a.id ? null : a.id)}>
                <div className="a-row a-row--wrap" style={{ gap: 12 }}>
                  <strong style={{ fontSize: 16 }}>{a.name}</strong>
                  <span className="a-muted"><IconPhone size={14} /> {a.phone}</span>
                  {a.bus && <span className="a-badge a-badge--info">{a.bus}</span>}
                </div>
                <div className="a-row a-row--wrap" style={{ gap: 10 }}>
                  <span className="a-badge" style={{ background: color(a.status), color: "#fff" }}>{label(a.status)}</span>
                  <span className="a-muted" style={{ fontSize: 12.5 }}>{a.created_at ? new Date(a.created_at).toLocaleString("uk-UA") : ""}</span>
                </div>
              </div>

              {open === a.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--a-line)" }}>
                  <div className="a-grid a-grid--stats" style={{ marginBottom: 12 }}>
                    {a.route && <div className="a-muted"><strong>Маршрут:</strong> {a.route}</div>}
                    {a.passengers && <div className="a-muted"><strong>Пасажирів:</strong> {a.passengers}</div>}
                    {a.email && <div className="a-muted"><strong>Email:</strong> {a.email}</div>}
                  </div>
                  {a.message && <p style={{ background: "#f7f9fc", padding: 12, borderRadius: 10, fontSize: 14, marginBottom: 12 }}>{a.message}</p>}

                  <div className="a-muted" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Статус:</div>
                  <div className="a-row a-row--wrap" style={{ gap: 6, marginBottom: 14 }}>
                    {statuses.map((s) => (
                      <button key={s.value} className="a-btn a-btn--sm"
                        style={{ background: a.status === s.value ? color(s.value) : "#eef3f9", color: a.status === s.value ? "#fff" : "#33475e" }}
                        onClick={() => changeStatus(a.id, s.value)}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="a-row a-row--wrap" style={{ gap: 8 }}>
                    <a className="a-btn a-btn--sm a-btn--green" href={`tel:${a.phone}`}>Подзвонити</a>
                    <a className="a-btn a-btn--sm" style={{ background: "#25d366", color: "#fff" }} target="_blank" rel="noreferrer"
                      href={`https://wa.me/${String(a.phone).replace(/[^0-9]/g, "")}`}>WhatsApp</a>
                    <a className="a-btn a-btn--sm" style={{ background: "#7360f2", color: "#fff" }} target="_blank" rel="noreferrer"
                      href={`viber://chat?number=${encodeURIComponent(a.phone)}`}>Viber</a>
                    <button className="a-btn a-btn--sm a-btn--red" onClick={() => remove(a.id)}><IconTrash size={14} /> Видалити</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
