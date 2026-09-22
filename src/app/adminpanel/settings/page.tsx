"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ImageField, ListEditor, TextField, useToast } from "@/components/admin/ui";

type Def = { key: string; label: string; type?: "text" | "textarea" | "image" | "list"; hint?: string };

const GROUPS: { title: string; defs: Def[] }[] = [
  {
    title: "Логотип і назва (брендінг)",
    defs: [
      { key: "logo_image", label: "Логотип компанії", type: "image", hint: "PNG або SVG на прозорому фоні. Показується у шапці, футері та як іконка сайту. Якщо порожньо — використовується стандартна іконка автобуса" },
      { key: "company_name", label: "Назва компанії" },
      { key: "header_subtitle", label: "Підзаголовок у шапці" },
      { key: "working_hours", label: "Графік роботи" },
      { key: "area", label: "Регіон роботи" },
    ],
  },
  {
    title: "Контакти",
    defs: [
      { key: "phone_display", label: "Телефон (як показувати)" },
      { key: "phone_raw", label: "Телефон (для посилання, +380...)" },
      { key: "phone_display2", label: "Телефон 2 (як показувати)" },
      { key: "phone_raw2", label: "Телефон 2 (для посилання)" },
      { key: "viber_raw", label: "Viber номер (+380...)" },
      { key: "whatsapp_raw", label: "WhatsApp номер (380...)" },
      { key: "telegram_username", label: "Telegram (нік або посилання)", hint: "напр. busrent або https://t.me/busrent — якщо порожньо, кнопка Telegram не показується" },
      { key: "email", label: "Email" },
      { key: "address", label: "Адреса" },
    ],
  },
  {
    title: "Перший екран (Hero)",
    defs: [
      { key: "hero_label", label: "Мітка над заголовком" },
      { key: "hero_title", label: "Заголовок" },
      { key: "hero_subtitle", label: "Підзаголовок", type: "textarea" },
      { key: "hero_points", label: "Короткі переваги (кожен рядок — окремий пункт)", type: "list" },
      { key: "hero_button_primary", label: "Кнопка 1" },
      { key: "hero_button_whatsapp", label: "Кнопка WhatsApp" },
      { key: "hero_button_viber", label: "Кнопка Viber" },
      { key: "hero_image", label: "Фонове зображення (необов'язково)", type: "image", hint: "Якщо не завантажено — використовується стандартне" },
    ],
  },
  {
    title: "Блок «Про компанію»",
    defs: [
      { key: "about_label", label: "Мітка" },
      { key: "about_title", label: "Заголовок" },
      { key: "about_text", label: "Текст про компанію", type: "textarea" },
      { key: "about_years", label: "Років на ринку" },
      { key: "about_buses", label: "Автобусів у парку" },
      { key: "about_trips", label: "Виконаних поїздок" },
      { key: "about_clients", label: "Задоволених клієнтів" },
      { key: "about_stat_years", label: "Підпис: роки" },
      { key: "about_stat_buses", label: "Підпис: автобуси" },
      { key: "about_stat_trips", label: "Підпис: поїздки" },
      { key: "about_stat_clients", label: "Підпис: клієнти" },
      { key: "about_image", label: "Фото блоку (необов'язково)", type: "image" },
    ],
  },
  {
    title: "Заголовки секцій",
    defs: [
      { key: "buses_label", label: "Автобуси: мітка" },
      { key: "buses_title", label: "Автобуси: заголовок" },
      { key: "buses_subtitle", label: "Автобуси: підзаголовок", type: "textarea" },
      { key: "services_label", label: "Послуги: мітка" },
      { key: "services_title", label: "Послуги: заголовок" },
      { key: "services_subtitle", label: "Послуги: підзаголовок", type: "textarea" },
      { key: "why_label", label: "Переваги: мітка" },
      { key: "why_title", label: "Переваги: заголовок" },
      { key: "why_subtitle", label: "Переваги: підзаголовок", type: "textarea" },
      { key: "steps_label", label: "Кроки: мітка" },
      { key: "steps_title", label: "Кроки: заголовок" },
      { key: "steps_subtitle", label: "Кроки: підзаголовок", type: "textarea" },
    ],
  },
  {
    title: "Форма заявки",
    defs: [
      { key: "form_label", label: "Мітка" },
      { key: "form_title", label: "Заголовок" },
      { key: "form_subtitle", label: "Підзаголовок", type: "textarea" },
      { key: "form_button", label: "Текст кнопки" },
      { key: "form_success", label: "Повідомлення після відправки", type: "textarea" },
    ],
  },
  {
    title: "Секція контактів та футер",
    defs: [
      { key: "contacts_label", label: "Контакти: мітка" },
      { key: "contacts_title", label: "Контакти: заголовок" },
      { key: "contacts_text", label: "Контакти: текст", type: "textarea" },
      { key: "footer_text", label: "Текст у футері", type: "textarea" },
    ],
  },
  {
    title: "SEO",
    defs: [
      { key: "seo_title", label: "SEO заголовок" },
      { key: "seo_description", label: "SEO опис", type: "textarea" },
    ],
  },
];

export default function SettingsAdmin() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const rows = await api("/api/admin/content/settings");
        const map: Record<string, string> = {};
        (rows || []).forEach((r: any) => { map[r.key] = r.value; });
        setValues(map);
      } catch (e: any) { toast(e.message); }
    })();
  }, [toast]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(values).map(([key, value]) => ({ key, value: value ?? "" }));
      await api("/api/admin/content/settings", { method: "POST", body: JSON.stringify(payload) });
      toast("Налаштування збережено");
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const grouped = useMemo(() => GROUPS, []);

  return (
    <div>
      <div className="a-page-head">
        <div>
          <h1>Налаштування сайту</h1>
          <p>Усі тексти, контакти та зображення сайту. Зміни з’являються на сайті одразу після збереження.</p>
        </div>
        <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Збереження..." : "Зберегти все"}
        </button>
      </div>

      {grouped.map((g) => (
        <div className="a-card" key={g.title} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>{g.title}</h3>
          <div className="a-form-grid">
            {g.defs.map((d) => {
              const v = values[d.key] ?? "";
              const span = d.type === "textarea" || d.type === "image" || d.type === "list";
              if (d.type === "image") {
                return <div key={d.key} className="span2"><ImageField label={d.label} value={v} onChange={(nv) => set(d.key, nv)} /></div>;
              }
              if (d.type === "list") {
                let list: string[] = [];
                try { list = v ? JSON.parse(v) : []; } catch { list = []; }
                return (
                  <div key={d.key} className="span2">
                    <ListEditor label={d.label} items={list} onChange={(nv) => set(d.key, JSON.stringify(nv))} />
                  </div>
                );
              }
              return (
                <div key={d.key} className={span ? "span2" : undefined}>
                  <TextField label={d.label} value={v} onChange={(nv) => set(d.key, nv)} hint={d.hint} textarea={d.type === "textarea"} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ position: "sticky", bottom: 0, padding: "14px 0" }}>
        <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Збереження..." : "Зберегти все"}
        </button>
      </div>
    </div>
  );
}
