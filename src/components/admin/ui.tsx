"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAsyncData } from "@/components/admin/useAsyncData";
import {
  Icon, IconCheck, IconChevronDown, IconChevronUp, IconClose, IconEdit, IconImage, IconInbox,
  IconLayers, IconPlus, IconTrash, ICON_OPTIONS,
} from "@/components/icons";

/* --------------------------------- helpers -------------------------------- */
export const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "");

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.error || `Помилка ${res.status}`);
  return data;
}

export const money = (v: any) => (v === null || v === undefined ? "" : String(v));

/* ---------------------------------- Toast --------------------------------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const push = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {msg && <div className="a-toast">{msg}</div>}
    </ToastCtx.Provider>
  );
}

/* ---------------------------------- Modal --------------------------------- */
export function Modal({
  title, children, onClose, footer, wide,
}: { title: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="a-modal" role="dialog" aria-modal="true">
      <div className="a-modal__overlay" onClick={onClose} />
      <div className="a-modal__panel" style={wide ? { width: "min(980px, 100%)" } : undefined}>
        <div className="a-modal__head">
          <h3>{title}</h3>
          <button className="a-iconbtn" onClick={onClose} aria-label="Закрити"><IconClose size={18} /></button>
        </div>
        <div className="a-modal__body">{children}</div>
        {footer && <div className="a-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------- Field bits ------------------------------- */
export function TextField({ label, value, onChange, placeholder, hint, textarea, type = "text" }: {
  label: string; value: any; onChange: (v: any) => void; placeholder?: string; hint?: string; textarea?: boolean; type?: string;
}) {
  return (
    <div className="a-field">
      <label>{label}</label>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: any; onChange: (v: any) => void; options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="a-field">
      <label>{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function BoolField({ label, value, onChange }: { label: string; value: any; onChange: (v: boolean) => void }) {
  return (
    <label className="a-check" style={{ marginBottom: 14 }}>
      <input type="checkbox" checked={value !== false} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function ListEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const arr = Array.isArray(items) ? items : [];
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...arr, v]);
    setDraft("");
  };
  return (
    <div className="a-field">
      <label>{label}</label>
      <div className="a-list__row">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="a-btn a-btn--gray a-btn--sm" onClick={add}><IconPlus size={15} /></button>
      </div>
      {arr.length > 0 && (
        <div className="a-chips">
          {arr.map((it, i) => (
            <span className="a-chip" key={`${it}-${i}`}>
              {it}
              <button type="button" onClick={() => onChange(arr.filter((_, idx) => idx !== i))} aria-label="Видалити"><IconClose size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <small>Натисніть Enter або «+», щоб додати пункт</small>
    </div>
  );
}

export function IconPicker({ value, onChange, label = "Іконка" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="a-field">
      <label>{label}</label>
      <div className="a-icon-picker">
        {ICON_OPTIONS.map((name) => (
          <button type="button" key={name} className={`a-icon-opt ${value === name ? "on" : ""}`} title={name} onClick={() => onChange(name)}>
            <Icon name={name} size={22} />
          </button>
        ))}
      </div>
    </div>
  );
}

export async function uploadFile(file: File): Promise<string> {
  const { uploadPhoto } = await import("@/lib/upload");
  return uploadPhoto(file);
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadFile(f)); }
    catch (err: any) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className="a-field">
      <label>{label}</label>
      <div className="a-list__row">
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="URL або завантажте файл" />
        <label className="a-btn a-btn--gray a-btn--sm" style={{ cursor: "pointer" }}>
          <IconImage size={16} /> {busy ? "..." : "Фото"}
          <input type="file" accept="image/*" hidden onChange={pick} disabled={busy} />
        </label>
      </div>
      {value && <img src={value} alt="" style={{ maxHeight: 150, borderRadius: 10, marginTop: 8, objectFit: "contain", background: "#f3f6fa" }} />}
    </div>
  );
}

export function PhotosManager({
  photos, mainPhoto, captions, onChange,
}: {
  photos: string[];
  mainPhoto: string;
  captions?: string[];
  onChange: (photos: string[], main: string, captions: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const urls = Array.isArray(photos) ? photos : [];
  const caps = Array.isArray(captions) ? captions : [];

  // Працюємо з парами «фото + підпис», щоб підпис завжди рухався разом із фото.
  const pairs = urls.map((url, i) => ({ url, caption: caps[i] || "" }));
  const emit = (next: { url: string; caption: string }[], main = mainPhoto) => {
    const nextUrls = next.map((p) => p.url);
    const nextMain = nextUrls.includes(main) ? main : nextUrls[0] || "";
    onChange(nextUrls, nextMain, next.map((p) => p.caption));
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const next = [...pairs];
    try {
      for (const f of Array.from(files)) {
        next.push({ url: await uploadFile(f), caption: "" });
      }
      emit(next, mainPhoto || next[0]?.url || "");
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pairs.length) return;
    const next = [...pairs];
    [next[i], next[j]] = [next[j], next[i]];
    emit(next);
  };

  const remove = (i: number) => {
    const removed = pairs[i].url;
    const next = pairs.filter((_, idx) => idx !== i);
    emit(next, mainPhoto === removed ? next[0]?.url || "" : mainPhoto);
  };

  const setCaption = (i: number, value: string) => {
    const next = pairs.map((p, idx) => (idx === i ? { ...p, caption: value } : p));
    emit(next);
  };

  const SUGGESTED = ["Зовні", "Салон", "Місце водія", "Багажне відділення"];

  return (
    <div className="a-field">
      <label>Фотографії ({pairs.length})</label>
      <label className="a-drop">
        <IconImage size={22} />
        <div style={{ marginTop: 6 }}>{busy ? "Завантаження..." : "Натисніть, щоб вибрати декілька фото"}</div>
        <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} disabled={busy} />
      </label>

      {pairs.length > 0 && (
        <div className="a-photos" style={{ marginTop: 12 }}>
          {pairs.map((pair, i) => (
            <div key={pair.url + i} className={`a-photo ${mainPhoto === pair.url ? "a-photo--main" : ""}`}>
              <img src={pair.url} alt="" />
              {mainPhoto === pair.url && <span className="a-photo__main-tag">Головне</span>}
              <div className="a-photo__tools">
                <button type="button" onClick={() => move(i, -1)} title="Раніше" disabled={i === 0} style={{ opacity: i === 0 ? 0.4 : 1 }}><IconChevronUp size={14} /></button>
                <button type="button" onClick={() => emit(pairs, pair.url)} title="Зробити головним"><IconCheck size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} title="Пізніше" disabled={i === pairs.length - 1} style={{ opacity: i === pairs.length - 1 ? 0.4 : 1 }}><IconChevronDown size={14} /></button>
                <button type="button" onClick={() => remove(i)} title="Видалити"><IconTrash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pairs.length > 0 && (
        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {pairs.map((pair, i) => (
            <div className="a-list__row" key={"cap" + pair.url + i}>
              <span className="a-muted" style={{ width: 26, textAlign: "right" }}>{i + 1}.</span>
              <input
                value={pair.caption}
                onChange={(e) => setCaption(i, e.target.value)}
                placeholder={SUGGESTED[i] ? `Підпис (напр. «${SUGGESTED[i]}»)` : "Підпис до фото"}
              />
            </div>
          ))}
          <div className="a-row a-row--wrap" style={{ gap: 6 }}>
            <span className="a-muted" style={{ fontSize: 12 }}>Підказка:</span>
            {SUGGESTED.map((label) => (
              <button
                type="button"
                key={label}
                className="a-btn a-btn--gray a-btn--sm"
                onClick={() => {
                  const empty = pairs.findIndex((p) => !p.caption);
                  if (empty >= 0) setCaption(empty, label);
                }}
              >
                + {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <small>
        Рекомендуємо 5–10 фото на автобус: зовні, салон, місце водія, багажне відділення, додаткові.
        Перше фото стає головним, якщо не обрано інше. Фото стискаються автоматично.
      </small>
    </div>
  );
}

/* ----------------------------- ResourceManager ---------------------------- */
export type FieldType = "text" | "textarea" | "number" | "bool" | "select" | "icon" | "image" | "photos" | "list";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  span?: boolean;
};

type Props = {
  type: string;
  title: string;
  description?: string;
  addLabel: string;
  fields: FieldDef[];
  defaults: Record<string, any>;
  primaryKey: string;   // field shown as card title
  secondaryKey?: string;
  thumbKey?: string;
  searchKeys?: string[];
};

export function ResourceManager({ type, title, description, addLabel, fields, defaults, primaryKey, secondaryKey, thumbKey, searchKeys = [] }: Props) {
  const { data, loading, reload } = useAsyncData<any[]>(() => api(`/api/admin/content/${type}`).then((d) => (Array.isArray(d) ? d : [])), []);
  const items = data;
  const [editing, setEditing] = useState<any | null>(null);
  const [query, setQuery] = useState("");
  const toast = useToast();

  const load = reload;

  const save = async () => {
    if (!editing) return;
    try {
      const method = editing.id ? "PUT" : "POST";
      await api(`/api/admin/content/${type}`, { method, body: JSON.stringify(editing) });
      setEditing(null);
      toast(editing.id ? "Збережено" : "Створено");
      load();
    } catch (e: any) { alert(e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm("Видалити запис? Дію не можна скасувати.")) return;
    try {
      await api(`/api/admin/content/${type}?id=${id}`, { method: "DELETE" });
      toast("Видалено");
      load();
    } catch (e: any) { alert(e.message); }
  };

  const toggleActive = async (item: any) => {
    try {
      await api(`/api/admin/content/${type}`, { method: "PUT", body: JSON.stringify({ id: item.id, active: item.active === false }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const move = async (item: any, dir: -1 | 1) => {
    const sorted = [...items];
    const idx = sorted.findIndex((i) => i.id === item.id);
    const target = sorted[idx + dir];
    if (!target) return;
    try {
      await api(`/api/admin/content/${type}`, { method: "PUT", body: JSON.stringify({ id: item.id, sort_order: target.sort_order ?? 0 }) });
      await api(`/api/admin/content/${type}`, { method: "PUT", body: JSON.stringify({ id: target.id, sort_order: item.sort_order ?? 0 }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => searchKeys.some((k) => String(i[k] || "").toLowerCase().includes(q)));
  }, [items, query, searchKeys]);

  const renderField = (f: FieldDef) => {
    const val = editing?.[f.key];
    const set = (v: any) => setEditing((prev: any) => ({ ...prev, [f.key]: v }));
    switch (f.type) {
      case "textarea": return <TextField key={f.key} label={f.label} value={val} onChange={set} placeholder={f.placeholder} hint={f.hint} textarea />;
      case "number": return <TextField key={f.key} label={f.label} value={val} onChange={set} type="number" hint={f.hint} />;
      case "bool": return <BoolField key={f.key} label={f.label} value={val} onChange={set} />;
      case "select": return <SelectField key={f.key} label={f.label} value={val} onChange={set} options={f.options || []} hint={f.hint} />;
      case "icon": return <IconPicker key={f.key} label={f.label} value={val || "check"} onChange={set} />;
      case "image": return <ImageField key={f.key} label={f.label} value={val} onChange={set} />;
      case "list": return <ListEditor key={f.key} label={f.label} items={val} onChange={set} placeholder={f.placeholder} />;
      case "photos": return <PhotosManager key={f.key} photos={editing?.photos} mainPhoto={editing?.main_photo} captions={editing?.photo_captions} onChange={(photos, main, captions) => setEditing((prev: any) => ({ ...prev, photos, main_photo: main, photo_captions: captions }))} />;
      default: return <TextField key={f.key} label={f.label} value={val} onChange={set} placeholder={f.placeholder} hint={f.hint} />;
    }
  };

  const openNew = () => setEditing({ ...defaults, sort_order: items.length });

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="a-row a-row--wrap">
          {searchKeys.length > 0 && items.length > 3 && (
            <input className="a-field" style={{ padding: "10px 13px", borderRadius: 10, border: "1.5px solid var(--a-line)", background: "#fff", minWidth: 200 }}
              placeholder="Пошук..." value={query} onChange={(e) => setQuery(e.target.value)} />
          )}
          <button className="a-btn a-btn--gray" onClick={load}>Оновити</button>
          <button className="a-btn a-btn--primary" onClick={openNew}><IconPlus size={16} /> {addLabel}</button>
        </div>
      </div>

      {loading ? (
        <div className="a-empty"><div className="a-empty__icon"><IconLayers size={28} /></div>Завантаження...</div>
      ) : filtered.length === 0 ? (
        <div className="a-card a-empty">
          <div className="a-empty__icon"><IconInbox size={28} /></div>
          <p>{items.length === 0 ? "Поки немає записів." : "Нічого не знайдено за пошуком."}</p>
          {items.length === 0 && <button className="a-btn a-btn--primary" style={{ marginTop: 14 }} onClick={openNew}><IconPlus size={16} /> {addLabel}</button>}
        </div>
      ) : (
        <div className="a-grid a-grid--cards">
          {filtered.map((item) => {
            const thumb = thumbKey ? item[thumbKey] || (Array.isArray(item.photos) ? item.photos[0] : "") : "";
            return (
              <div className="a-card" key={item.id} style={{ opacity: item.active === false ? 0.62 : 1 }}>
                <div className="a-row">
                  {thumbKey && (
                    <div className="a-thumb">{thumb ? <img src={thumb} alt="" /> : <IconImage size={24} />}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="a-row a-row--wrap" style={{ gap: 8 }}>
                      <strong style={{ fontSize: 15.5 }}>{item[primaryKey] || "—"}</strong>
                      {item.active === false && <span className="a-badge a-badge--off">Приховано</span>}
                    </div>
                    {secondaryKey && <div className="a-muted" style={{ fontSize: 13, marginTop: 2 }}>{item[secondaryKey]}</div>}
                  </div>
                </div>

                <div className="a-row a-row--wrap" style={{ marginTop: 14, gap: 8 }}>
                  <button className="a-btn a-btn--sm a-btn--gray" onClick={() => move(item, -1)} title="Вище"><IconChevronUp size={15} /></button>
                  <button className="a-btn a-btn--sm a-btn--gray" onClick={() => move(item, 1)} title="Нижче"><IconChevronDown size={15} /></button>
                  <button className="a-btn a-btn--sm" style={{ background: item.active === false ? "var(--a-green)" : "var(--a-amber)", color: "#fff" }} onClick={() => toggleActive(item)}>
                    {item.active === false ? "Показати" : "Приховати"}
                  </button>
                  <button className="a-btn a-btn--sm a-btn--blue" onClick={() => setEditing({ ...item })}><IconEdit size={14} /> Редагувати</button>
                  <button className="a-btn a-btn--sm a-btn--red" onClick={() => remove(item.id)}><IconTrash size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? `${title}: редагування` : `${title}: новий запис`}
          onClose={() => setEditing(null)}
          wide
          footer={
            <>
              <button className="a-btn a-btn--gray" onClick={() => setEditing(null)}>Скасувати</button>
              <button className="a-btn a-btn--primary" onClick={save}>Зберегти</button>
            </>
          }
        >
          <div className="a-form-grid">
            {fields.map((f) => (
              <div key={f.key} className={f.span || f.type === "photos" || f.type === "icon" || f.type === "textarea" || f.type === "list" ? "span2" : undefined}>
                {renderField(f)}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export { useAsyncData } from "@/components/admin/useAsyncData";
