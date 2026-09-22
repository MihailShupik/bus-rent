"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Icon, IconChevronDown, IconChevronUp, IconEdit, IconLayers, IconPlus, IconTrash, ICON_OPTIONS,
} from "@/components/icons";
import { api, ImageField, ListEditor, Modal, TextField, useToast } from "@/components/admin/ui";
import { fieldKey, slugify } from "@/lib/format";

type FieldType = "text" | "textarea" | "number" | "image" | "list" | "bool";
type FieldDef = { key: string; label: string; type: FieldType };
type CType = { id: number; slug: string; name: string; description: string; icon: string; fields: FieldDef[]; sort_order: number; active: boolean };
type CItem = { id: number; type_slug: string; data: Record<string, any>; sort_order: number; active: boolean };

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Текст (рядок)" },
  { value: "textarea", label: "Текст (багато рядків)" },
  { value: "number", label: "Число" },
  { value: "image", label: "Зображення" },
  { value: "list", label: "Список (багато пунктів)" },
  { value: "bool", label: "Так / Ні" },
];

const emptyType = (): CType => ({ id: 0, slug: "", name: "", description: "", icon: "layers", fields: [{ key: "title", label: "Заголовок", type: "text" }, { key: "text", label: "Опис", type: "textarea" }], sort_order: 0, active: true });

export default function BuilderAdmin() {
  const [types, setTypes] = useState<CType[]>([]);
  const [items, setItems] = useState<CItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [editType, setEditType] = useState<CType | null>(null);
  const [editItem, setEditItem] = useState<CItem | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, i] = await Promise.all([api("/api/admin/content/types"), api("/api/admin/content/items")]);
        if (cancelled) return;
        setTypes(Array.isArray(t) ? t : []);
        setItems(Array.isArray(i) ? i : []);
        setActiveSlug((prev) => prev || (t?.[0]?.slug ?? ""));
      } catch (e: any) {
        if (!cancelled) toast(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const load = useCallback(async () => {
    try {
      const [t, i] = await Promise.all([api("/api/admin/content/types"), api("/api/admin/content/items")]);
      setTypes(Array.isArray(t) ? t : []);
      setItems(Array.isArray(i) ? i : []);
      setActiveSlug((prev) => prev || (t?.[0]?.slug ?? ""));
    } catch (e: any) { toast(e.message); }
    setLoading(false);
  }, [toast]);

  const activeType = useMemo(() => types.find((t) => t.slug === activeSlug), [types, activeSlug]);
  const typeItems = useMemo(() => items.filter((i) => i.type_slug === activeSlug).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [items, activeSlug]);

  /* ------------------------------- types CRUD ------------------------------- */
  const saveType = async () => {
    if (!editType) return;
    const slug = editType.id ? editType.slug : slugify(editType.slug || editType.name);
    if (!slug) { alert("Вкажіть назву або slug"); return; }
    if (!editType.fields?.length) { alert("Додайте хоча б одне поле"); return; }
    try {
      const body = { ...editType, slug };
      if (editType.id) await api("/api/admin/content/types", { method: "PUT", body: JSON.stringify(body) });
      else await api("/api/admin/content/types", { method: "POST", body: JSON.stringify(body) });
      setEditType(null);
      toast("Тип блоку збережено");
      load();
    } catch (e: any) { alert(e.message); }
  };

  const removeType = async (t: CType) => {
    if (!confirm(`Видалити тип «${t.name}» та всі його елементи?`)) return;
    try {
      for (const it of items.filter((i) => i.type_slug === t.slug)) {
        await api(`/api/admin/content/items?id=${it.id}`, { method: "DELETE" });
      }
      await api(`/api/admin/content/types?id=${t.id}`, { method: "DELETE" });
      toast("Видалено");
      setActiveSlug("");
      load();
    } catch (e: any) { alert(e.message); }
  };

  const addField = () => setEditType((p) => p && { ...p, fields: [...p.fields, { key: `field_${p.fields.length + 1}`, label: "Нове поле", type: "text" }] });
  const updateField = (i: number, patch: Partial<FieldDef>) => setEditType((p) => p && { ...p, fields: p.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  const removeField = (i: number) => setEditType((p) => p && { ...p, fields: p.fields.filter((_, idx) => idx !== i) });

  /* ------------------------------- items CRUD ------------------------------- */
  const saveItem = async () => {
    if (!editItem) return;
    try {
      const body = { ...editItem, type_slug: activeSlug };
      if (editItem.id) await api("/api/admin/content/items", { method: "PUT", body: JSON.stringify(body) });
      else await api("/api/admin/content/items", { method: "POST", body: JSON.stringify(body) });
      setEditItem(null);
      toast("Елемент збережено");
      load();
    } catch (e: any) { alert(e.message); }
  };

  const removeItem = async (id: number) => {
    if (!confirm("Видалити елемент?")) return;
    try {
      await api(`/api/admin/content/items?id=${id}`, { method: "DELETE" });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const toggleItem = async (it: CItem) => {
    try {
      await api("/api/admin/content/items", { method: "PUT", body: JSON.stringify({ id: it.id, active: it.active === false }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const moveItem = async (it: CItem, dir: -1 | 1) => {
    const idx = typeItems.findIndex((i) => i.id === it.id);
    const target = typeItems[idx + dir];
    if (!target) return;
    try {
      await api("/api/admin/content/items", { method: "PUT", body: JSON.stringify({ id: it.id, sort_order: target.sort_order ?? 0 }) });
      await api("/api/admin/content/items", { method: "PUT", body: JSON.stringify({ id: target.id, sort_order: it.sort_order ?? 0 }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const newItem = () => {
    const data: Record<string, any> = {};
    activeType?.fields?.forEach((f) => { data[f.key] = f.type === "list" ? [] : f.type === "bool" ? true : ""; });
    setEditItem({ id: 0, type_slug: activeSlug, data, sort_order: typeItems.length, active: true });
  };

  const renderItemField = (f: FieldDef) => {
    const val = editItem?.data?.[f.key];
    const set = (v: any) => setEditItem((p) => p && { ...p, data: { ...p.data, [f.key]: v } });
    if (f.type === "textarea") return <TextField key={f.key} label={f.label} value={val} onChange={set} textarea />;
    if (f.type === "number") return <TextField key={f.key} label={f.label} value={val} onChange={set} type="number" />;
    if (f.type === "image") return <ImageField key={f.key} label={f.label} value={val} onChange={set} />;
    if (f.type === "list") return <ListEditor key={f.key} label={f.label} items={val} onChange={set} />;
    if (f.type === "bool") return (
      <label key={f.key} className="a-check" style={{ marginBottom: 14 }}>
        <input type="checkbox" checked={val !== false} onChange={(e) => set(e.target.checked)} /> {f.label}
      </label>
    );
    return <TextField key={f.key} label={f.label} value={val} onChange={set} />;
  };

  if (loading) return <div className="a-empty">Завантаження...</div>;

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Універсальний конструктор блоків</h1>
          <p>
            Створюйте власні блоки контенту з будь-якими полями (текст, фото, списки, числа). Кожен активний блок автоматично
            з’являється на сайті окремою секцією. Це дає змогу додавати нові розділи без участі програміста.
          </p>
        </div>
        <button className="a-btn a-btn--primary" onClick={() => setEditType(emptyType())}><IconPlus size={16} /> Створити тип блоку</button>
      </div>

      <div className="a-split">
        {/* types list */}
        <div className="a-card" style={{ padding: 12 }}>
          <div className="a-muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 8px" }}>Типи блоків</div>
          {types.length === 0 && <div className="a-muted" style={{ padding: 10 }}>Ще немає типів. Створіть перший блок.</div>}
          {types.map((t) => (
            <div key={t.id}
              onClick={() => setActiveSlug(t.slug)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 11, cursor: "pointer",
                background: activeSlug === t.slug ? "rgba(255,122,26,0.1)" : "transparent",
                border: activeSlug === t.slug ? "1px solid rgba(255,122,26,0.4)" : "1px solid transparent",
              }}>
              <span className="a-thumb" style={{ width: 38, height: 38, borderRadius: 10 }}><Icon name={t.icon || "layers"} size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 14.5 }}>{t.name}</strong>
                <div className="a-muted" style={{ fontSize: 12 }}>{t.fields?.length || 0} полів · {items.filter((i) => i.type_slug === t.slug).length} елементів</div>
              </div>
              {t.active === false && <span className="a-badge a-badge--off">off</span>}
            </div>
          ))}
        </div>

        {/* items area */}
        <div>
          {!activeType ? (
            <div className="a-card a-empty">
              <div className="a-empty__icon"><IconLayers size={28} /></div>
              <p>Оберіть тип блоку ліворуч або створіть новий.</p>
            </div>
          ) : (
            <>
              <div className="a-card a-between" style={{ marginBottom: 14 }}>
                <div>
                  <div className="a-row a-row--wrap" style={{ gap: 10 }}>
                    <strong style={{ fontSize: 17 }}>{activeType.name}</strong>
                    <span className="a-badge a-badge--info">/{activeType.slug}</span>
                  </div>
                  <div className="a-muted" style={{ marginTop: 4 }}>{activeType.description || "Без опису"}</div>
                </div>
                <div className="a-row a-row--wrap">
                  <button className="a-btn a-btn--gray a-btn--sm" onClick={() => setEditType({ ...activeType })}><IconEdit size={14} /> Редагувати тип</button>
                  <button className="a-btn a-btn--red a-btn--sm" onClick={() => removeType(activeType)}><IconTrash size={14} /></button>
                  <button className="a-btn a-btn--primary a-btn--sm" onClick={newItem}><IconPlus size={15} /> Додати елемент</button>
                </div>
              </div>

              {typeItems.length === 0 ? (
                <div className="a-card a-empty">
                  <div className="a-empty__icon"><IconLayers size={26} /></div>
                  <p>Немає елементів. Додайте перший.</p>
                </div>
              ) : (
                <div className="a-grid" style={{ gap: 12 }}>
                  {typeItems.map((it) => (
                    <div className="a-card" key={it.id} style={{ opacity: it.active === false ? 0.6 : 1 }}>
                      <div className="a-row">
                        {it.data?.image && <div className="a-thumb"><img src={it.data.image} alt="" /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="a-row a-row--wrap" style={{ gap: 8 }}>
                            <strong>{it.data?.title || it.data?.name || "Елемент"}</strong>
                            {it.active === false && <span className="a-badge a-badge--off">Приховано</span>}
                          </div>
                          <div className="a-muted" style={{ fontSize: 13 }}>{it.data?.text || it.data?.description || ""}</div>
                        </div>
                        <div className="a-row" style={{ gap: 6 }}>
                          <button className="a-btn a-btn--sm a-btn--gray" onClick={() => moveItem(it, -1)}><IconChevronUp size={15} /></button>
                          <button className="a-btn a-btn--sm a-btn--gray" onClick={() => moveItem(it, 1)}><IconChevronDown size={15} /></button>
                          <button className="a-btn a-btn--sm" style={{ background: it.active === false ? "var(--a-green)" : "var(--a-amber)", color: "#fff" }} onClick={() => toggleItem(it)}>
                            {it.active === false ? "Показати" : "Приховати"}
                          </button>
                          <button className="a-btn a-btn--sm a-btn--blue" onClick={() => setEditItem({ ...it, data: { ...it.data } })}><IconEdit size={14} /></button>
                          <button className="a-btn a-btn--sm a-btn--red" onClick={() => removeItem(it.id)}><IconTrash size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---------------------------- type editor ---------------------------- */}
      {editType && (
        <Modal
          title={editType.id ? "Редагування типу блоку" : "Новий тип блоку"}
          onClose={() => setEditType(null)}
          wide
          footer={<><button className="a-btn a-btn--gray" onClick={() => setEditType(null)}>Скасувати</button><button className="a-btn a-btn--primary" onClick={saveType}>Зберегти</button></>}
        >
          <div className="a-form-grid">
            <TextField label="Назва блоку" value={editType.name} onChange={(v) => setEditType({ ...editType, name: v, slug: editType.id ? editType.slug : slugify(v) })} placeholder="Часті питання" />
            <TextField label="Slug (латиниця)" value={editType.slug} onChange={(v) => setEditType({ ...editType, slug: slugify(v) })} placeholder="faq" />
            <div className="span2"><TextField label="Опис (показується під заголовком на сайті)" value={editType.description} onChange={(v) => setEditType({ ...editType, description: v })} textarea /></div>
            <div className="a-field span2">
              <label>Іконка блоку</label>
              <div className="a-icon-picker">
                {ICON_OPTIONS.map((n) => (
                  <button type="button" key={n} className={`a-icon-opt ${editType.icon === n ? "on" : ""}`} onClick={() => setEditType({ ...editType, icon: n })} title={n}>
                    <Icon name={n} size={22} />
                  </button>
                ))}
              </div>
            </div>
            <div className="a-field span2">
              <label className="a-check"><input type="checkbox" checked={editType.active !== false} onChange={(e) => setEditType({ ...editType, active: e.target.checked })} /> Показувати блок на сайті</label>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div className="a-between" style={{ marginBottom: 10 }}>
              <strong>Поля елементів</strong>
              <button className="a-btn a-btn--green a-btn--sm" onClick={addField}><IconPlus size={14} /> Додати поле</button>
            </div>
            <div className="a-grid" style={{ gap: 10 }}>
              {editType.fields.map((f, i) => (
                <div className="a-card a-fieldrow" key={i}>
                  <div className="a-field" style={{ marginBottom: 0 }}>
                    <label>Ключ</label>
                    <input value={f.key} onChange={(e) => updateField(i, { key: fieldKey(e.target.value) })} />
                  </div>
                  <div className="a-field" style={{ marginBottom: 0 }}>
                    <label>Підпис</label>
                    <input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
                  </div>
                  <div className="a-field" style={{ marginBottom: 0 }}>
                    <label>Тип</label>
                    <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FieldType })}>
                      {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </select>
                  </div>
                  <button className="a-btn a-btn--red a-btn--sm" onClick={() => removeField(i)}><IconTrash size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ---------------------------- item editor ---------------------------- */}
      {editItem && activeType && (
        <Modal
          title={`${activeType.name}: ${editItem.id ? "редагування" : "новий елемент"}`}
          onClose={() => setEditItem(null)}
          footer={<><button className="a-btn a-btn--gray" onClick={() => setEditItem(null)}>Скасувати</button><button className="a-btn a-btn--primary" onClick={saveItem}>Зберегти</button></>}
        >
          {activeType.fields.map((f) => <div key={f.key}>{renderItemField(f)}</div>)}
          <label className="a-check" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={editItem.active !== false} onChange={(e) => setEditItem({ ...editItem, active: e.target.checked })} /> Показувати на сайті
          </label>
        </Modal>
      )}
    </div>
  );
}
