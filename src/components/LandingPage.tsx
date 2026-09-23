"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Icon, IconArrowRight, IconBus, IconCheck, IconClose, IconMail, IconMapPin,
  IconChat, IconMenu, IconPhone, IconSeat, IconSend, IconStar, IconSteering, IconTelegram, IconViber, IconWhatsApp,
} from "@/components/icons";
import { companyName as fbCompany, contacts as fbContacts, navItems } from "@/config/site";
import type { SiteData } from "@/lib/content";
import { isValidPhone, mainPhotoOf, photoGallery, priceUnit as normalizePriceUnit } from "@/lib/format";

type Props = { initialData: SiteData | null };

const emptyData: SiteData = { settings: {}, buses: [], services: [], advantages: [], steps: [], contentTypes: [], contentItems: [] };

const KNOWN_TYPES = ["advantages", "steps"];

/**
 * Логотип компанії: завантажений з адмінки показуємо як звичайне зображення
 * (без рамок-«коробок»), інакше - стандартна SVG-іконка автобуса.
 */
function BrandMark({ logo, size = 26, badge = false }: { logo?: string; size?: number; badge?: boolean }) {
  if (logo) return <img className="brand__logo" src={logo} alt="" />;
  return <span className="brand__mark" style={badge ? { background: "linear-gradient(135deg,#ff7a1a,#ffa64d)" } : undefined}><IconBus size={size} /></span>;
}

export default function LandingPage({ initialData }: Props) {
  const [data, setData] = useState<SiteData>(initialData || emptyData);
  const [ready, setReady] = useState(!!initialData);
  const [loadError, setLoadError] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [galleryBus, setGalleryBus] = useState<any | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [toast] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", email: "", bus: "", route: "", passengers: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const formAnchor = useRef<HTMLDivElement>(null);

  /* ---------------------------- data loading ---------------------------- */
  useEffect(() => {
    if (initialData) {
      const t = setTimeout(() => setReady(true), 60);
      return () => clearTimeout(t);
    }
    fetch("/api/content")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setData(d);
        else setLoadError(d?.error || "Не вдалося завантажити дані сайту");
      })
      .catch((e) => setLoadError(String(e?.message || e)))
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------- reveal on scroll -------------------------- */
  useEffect(() => {
    if (!ready) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    // Progressive enhancement: if the browser has no IntersectionObserver,
    // simply show everything instead of leaving content invisible.
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("reveal--visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("reveal--visible")),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ready, data]);

  const s = (key: string, fallback: string) => data.settings?.[key] || fallback;
  const logo = data.settings?.logo_image || "";
  /** Telegram: приймає нік (@name), «name» або повне посилання. Порожньо → кнопки немає. */
  const tgLink = (raw: string) => {
    const v = (raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `https://t.me/${v.replace(/^@/, "")}`;
  };

  const contacts = {
    phoneDisplay: s("phone_display", fbContacts.phoneDisplay),
    phoneRaw: s("phone_raw", fbContacts.phoneRaw),
    phoneDisplay2: s("phone_display2", fbContacts.phoneDisplay2),
    phoneRaw2: s("phone_raw2", fbContacts.phoneRaw2),
    viberRaw: s("viber_raw", fbContacts.viberRaw),
    whatsappRaw: s("whatsapp_raw", fbContacts.whatsappRaw),
    email: s("email", fbContacts.email),
    address: s("address", fbContacts.address),
    workingHours: s("working_hours", fbContacts.workingHours),
    area: s("area", fbContacts.area),
    telegram: s("telegram_username", ""),
  };
  const links = {
    phone: `tel:${contacts.phoneRaw}`,
    phone2: `tel:${contacts.phoneRaw2}`,
    viber: `viber://chat?number=${encodeURIComponent(contacts.viberRaw)}`,
    whatsapp: `https://wa.me/${contacts.whatsappRaw.replace(/[^0-9]/g, "")}`,
    email: `mailto:${contacts.email}`,
    telegram: tgLink(contacts.telegram),
  };

  const heroPoints: string[] = useMemo(() => {
    try {
      const raw = data.settings?.hero_points;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return ["Автобуси від 17 до 55 місць", "Досвідчені водії", "Подача транспорту за адресою", "Працюємо 24/7"];
  }, [data.settings?.hero_points]);

  const customTypes = (data.contentTypes || []).filter((t) => !KNOWN_TYPES.includes(t.slug) && t.active !== false);

  const track = (type: string, value = "") => {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: type, event_data: value, page_url: typeof window !== "undefined" ? window.location.href : "" }),
      }).catch(() => {});
    } catch {}
  };

  const goToForm = (busName?: string) => {
    if (busName !== undefined) setForm((f) => ({ ...f, bus: busName }));
    setTimeout(() => {
      formAnchor.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const el = document.getElementById("form-name") as HTMLInputElement | null;
      el?.focus({ preventScroll: true });
    }, 60);
    setDrawer(false);
    track("cta_to_form", busName || "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(form.phone)) {
      setStatus("error");
      setErrorText("Перевірте номер телефону. Дозволені лише цифри та символи + ( ) -");
      return;
    }
    setStatus("sending");
    setErrorText("");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
          bus: form.bus, route: form.route.trim(), passengers: form.passengers.trim(), message: form.message.trim(),
        }),
      });
      const payload = await r.json().catch(() => null);
      if (!r.ok) {
        setStatus("error");
        setErrorText(payload?.error || "Не вдалося надіслати заявку. Спробуйте ще раз.");
        return;
      }
      setStatus("success");
      track("submit_application", form.bus);
      setForm({ name: "", phone: "", email: "", bus: "", route: "", passengers: "", message: "" });
    } catch {
      setStatus("error");
      setErrorText("Помилка мережі. Перевірте з'єднання та спробуйте ще раз.");
    }
  };

  const openGallery = (bus: any) => {
    setGalleryBus(bus);
    setActivePhoto(0);
    track("view_bus", bus.name);
  };

  const busPhoto = (b: any) => mainPhotoOf(b);
  const busCaption = (b: any, i: number) => (Array.isArray(b.photo_captions) ? b.photo_captions[i] || "" : "");
  const busPhotos = (b: any) => photoGallery(b);
  const money = (v: string) => (v || "").toString();
  const priceUnit = (u: string) => normalizePriceUnit(u);

  if (ready && loadError && !data.buses.length && !data.services.length) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
        <div style={{ maxWidth: 620, background: "#fff", borderRadius: 18, padding: 30, boxShadow: "0 12px 34px rgba(16,35,58,.1)", border: "1px solid #e4e9f0" }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>Сайт не підключено до бази даних</h1>
          <p style={{ color: "#5b6b7f", marginBottom: 16 }}>
            Застосунок працює, але не бачить базу. Додайте змінні середовища у налаштуваннях
            проєкту на хостингу (Vercel → Settings → Environment Variables) і зробіть Redeploy:
          </p>
          <pre style={{ background: "#0d2137", color: "#e6eef7", padding: 16, borderRadius: 12, fontSize: 13, overflowX: "auto", lineHeight: 1.7 }}>
{`DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
JWT_SECRET=<довільний довгий рядок>
ADMIN_EMAIL=<ваш email>
ADMIN_PASSWORD=<ваш пароль>
TELEGRAM_BOT_TOKEN=<токен від @BotFather>`}
          </pre>
          <p style={{ color: "#5b6b7f", fontSize: 13, marginTop: 14 }}>
            Технічна деталь: <code>{loadError}</code>
          </p>
          <p style={{ color: "#5b6b7f", fontSize: 13, marginTop: 6 }}>
            Після додавання змінних перший запит сам створить таблиці й наповнить базу.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader" />
          <p style={{ color: "#5b6b7f", marginTop: 16 }}>Завантаження...</p>
          <style>{`.loader{width:46px;height:46px;border:4px solid #e4e9f0;border-top-color:#ff7a1a;border-radius:50%;margin:0 auto;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ------------------------------ Header ------------------------------- */}
      <header className="header">
        <div className="container header__row">
          <a className="brand" href="#hero">
            <BrandMark logo={logo} size={26} />
            {/* Якщо завантажено логотип, назву в шапці не дублюємо */}
            {!logo && (
              <span className="brand__text">
                <strong>{s("company_name", fbCompany)}</strong>
                <small>{s("header_subtitle", "Пасажирські перевезення та оренда автобусів")}</small>
              </span>
            )}
          </a>

          <nav className="nav">
            {navItems.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>

          <div className="header__actions">
            <a className="header__phone" href={links.phone} onClick={() => track("click_phone")}>
              <strong>{contacts.phoneDisplay}</strong>
              <span>{contacts.workingHours}</span>
            </a>
            <button className="btn btn--accent" onClick={() => goToForm()}><IconSend size={15} /> Замовити перевезення</button>
            <a className="header__call" href={links.phone} aria-label="Подзвонити" onClick={() => track("click_phone")}>
              <IconPhone size={19} color="#fff" />
            </a>
            <button className="burger" aria-label="Меню" onClick={() => setDrawer(true)}><IconMenu size={22} /></button>
          </div>
        </div>
      </header>

      {/* --------------------------- Mobile drawer --------------------------- */}
      <div className={`drawer ${drawer ? "drawer--open" : ""}`}>
        <div className="drawer__overlay" onClick={() => setDrawer(false)} />
        <div className="drawer__panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 18 }}>{s("company_name", fbCompany)}</strong>
            <button onClick={() => setDrawer(false)} aria-label="Закрити" style={{ background: "none", border: "none" }}><IconClose size={24} /></button>
          </div>
          {navItems.map((n) => <a key={n.href} href={n.href} onClick={() => setDrawer(false)}>{n.label}</a>)}
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <a className="btn btn--accent btn--block" href={links.phone}><IconPhone size={18} /> {contacts.phoneDisplay}</a>
            <a className="btn btn--wa btn--block" href={links.whatsapp} target="_blank" rel="noreferrer"><IconWhatsApp size={18} color="#fff" /> WhatsApp</a>
            <a className="btn btn--viber btn--block" href={links.viber} target="_blank" rel="noreferrer"><IconViber size={18} color="#fff" /> Viber</a>
            {links.telegram && <a className="btn btn--tg btn--block" href={links.telegram} target="_blank" rel="noreferrer"><IconTelegram size={18} color="#fff" /> Telegram</a>}
            <button className="btn btn--navy btn--block" onClick={() => goToForm()}><IconSend size={15} /> Замовити перевезення</button>
          </div>
        </div>
      </div>

      <main>
        {/* -------------------------------- Hero ------------------------------- */}
        <section className="hero" id="hero">
          <div className="hero__bg">
            {data.settings?.hero_image ? <img src={data.settings.hero_image} alt="" /> : <img src="/photos/hero.svg" alt="" />}
          </div>
          <div className="hero__gradient" />
          <div className="container hero__inner">
            <div>
              <span className="hero__label"><IconSeat size={16} /> {s("hero_label", "Оренда автобусів і мікроавтобусів")}</span>
              <h1>{s("hero_title", "Пасажирські перевезення та оренда автобусів")}</h1>
              <p className="hero__text">
                {s("hero_subtitle", "Комфортабельні автобуси та мікроавтобуси для поїздок містом, міжміських перевезень, трансферів і заходів.")}
              </p>
              <div className="hero__actions">
                <button className="btn btn--accent btn--lg" onClick={() => goToForm()}>
                  {s("hero_button_primary", "Розрахувати вартість")} <IconArrowRight size={16} />
                </button>
                <a className="btn btn--wa btn--lg" href={links.whatsapp} target="_blank" rel="noreferrer" onClick={() => track("click_whatsapp")}>
                  <IconWhatsApp size={18} color="#fff" /> {s("hero_button_whatsapp", "WhatsApp")}
                </a>
                <a className="btn btn--viber btn--lg" href={links.viber} target="_blank" rel="noreferrer" onClick={() => track("click_viber")}>
                  <IconViber size={18} color="#fff" /> {s("hero_button_viber", "Viber")}
                </a>
                {links.telegram && (
                  <a className="btn btn--tg btn--lg" href={links.telegram} target="_blank" rel="noreferrer" onClick={() => track("click_telegram")}>
                    <IconTelegram size={18} color="#fff" /> Telegram
                  </a>
                )}
              </div>
              <ul className="hero__points">
                {heroPoints.map((p) => <li key={p}><IconCheck size={18} /> {p}</li>)}
              </ul>
            </div>

            <aside className="hero__card">
              <h3>Автопарк онлайн</h3>
              <p>Підберемо транспорт під кількість пасажирів і маршрут</p>
              <div className="hero__stat-grid">
                <div className="hero__stat"><strong>{data.buses.length || 8}+</strong><span>моделей транспорту</span></div>
                <div className="hero__stat"><strong>17-55</strong><span>пасажирських місць</span></div>
                <div className="hero__stat"><strong>24/7</strong><span>прийом замовлень</span></div>
                <div className="hero__stat"><strong>0 €</strong><span>вартість розрахунку</span></div>
              </div>
              <div className="hero__trust">
                <div><IconSteering size={18} /> Досвідчені водії</div>
                <div><IconCheck size={18} /> Подача за адресою</div>
              </div>
            </aside>
          </div>
        </section>

        {/* ------------------------------- About ------------------------------- */}
        <section className="section" id="about">
          <div className={`container about-grid ${data.settings?.about_image ? "" : "about-grid--single"}`}>
            <div className="reveal">
              <span className="eyebrow">{s("about_label", "Про компанію")}</span>
              <h2 className="section-title">{s("about_title", "Наша компанія")}</h2>
              <p className="about-text">{s("about_text", "")}</p>
              <div className="stats">
                <div className="stat"><strong>{s("about_years", "12")}+</strong><span>{s("about_stat_years", "років на ринку")}</span></div>
                <div className="stat"><strong>{s("about_buses", "40")}+</strong><span>{s("about_stat_buses", "автобусів у парку")}</span></div>
                <div className="stat"><strong>{s("about_trips", "25000")}+</strong><span>{s("about_stat_trips", "виконаних поїздок")}</span></div>
                <div className="stat"><strong>{s("about_clients", "1800")}+</strong><span>{s("about_stat_clients", "задоволених клієнтів")}</span></div>
              </div>
            </div>
            {data.settings?.about_image && (
            <div className="about-media reveal">
              <img src={data.settings.about_image} alt="Автопарк" />
              <div className="about-badge">
                <span className="about-badge__mark"><IconBus size={24} /></span>
                <span><strong>{s("about_buses", "40")}+</strong><span>автобусів у власному парку</span></span>
              </div>
            </div>
            )}
          </div>
        </section>

        {/* -------------------------------- Buses ------------------------------ */}
        <section className="section section--alt" id="buses">
          <div className="container">
            <div className="section-head section-head--center reveal">
              <span className="eyebrow">{s("buses_label", "Наш транспорт")}</span>
              <h2 className="section-title">{s("buses_title", "Автобуси та мікроавтобуси")}</h2>
              <p className="section-sub">{s("buses_subtitle", "")}</p>
            </div>

            <div className="buses-grid">
              {data.buses.map((b) => (
                <article className="bus-card reveal" key={b.id}>
                  <div className="bus-card__media" onClick={() => openGallery(b)}>
                    {busPhoto(b) ? <img src={busPhoto(b)} alt={b.name} loading="lazy" /> : <div className="bus-card__placeholder"><IconBus size={78} strokeWidth={1.1} /></div>}
                    {b.bus_type && <span className="bus-card__tag">{b.bus_type}</span>}
                    {!!b.seats && <span className="bus-card__seats"><IconSeat size={14} /> {b.seats} місць</span>}
                    {busPhotos(b).length > 1 && (
                      <span className="bus-card__photos-count">{busPhotos(b).length} фото</span>
                    )}
                  </div>
                  <div className="bus-card__body">
                    <div>
                      <h3 className="bus-card__title">{b.name}</h3>
                      <div className="bus-card__model">{[b.brand, b.model].filter(Boolean).join(" · ")}{b.year ? ` · ${b.year}` : ""}</div>
                    </div>
                    {b.description && <p className="bus-card__desc">{b.description}</p>}
                    {Array.isArray(b.specs) && b.specs.length > 0 && (
                      <div className="bus-card__specs">
                        {b.specs.slice(0, 4).map((sp: string) => <span className="chip" key={sp}>{sp}</span>)}
                      </div>
                    )}
                    {b.rental_terms && <div className="bus-card__terms">Умови: {b.rental_terms}</div>}
                    <div className="bus-card__price-row">
                      <div className="bus-card__price">
                        <strong>{b.price ? `від ${money(b.price)} €` : "за запитом"}</strong>
                        <span> / {priceUnit(b.price_unit)}</span>
                      </div>
                      <button className="btn btn--accent" onClick={() => goToForm(`${b.name}${b.seats ? ` (${b.seats} місць)` : ""}`)}>
                        <IconSend size={15} /> Замовити
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------- Services ---------------------------- */}
        {data.services.length > 0 && (
          <section className="section" id="services">
            <div className="container">
              <div className="section-head section-head--center reveal">
                <span className="eyebrow">{s("services_label", "Наші послуги")}</span>
                <h2 className="section-title">{s("services_title", "Що ми робимо")}</h2>
                <p className="section-sub">{s("services_subtitle", "")}</p>
              </div>
              <div className="cards-grid">
                {data.services.map((sv) => (
                  <article className="service-card reveal" key={sv.id}>
                    {sv.image ? (
                      <div className="service-card__media"><img src={sv.image} alt={sv.name} loading="lazy" /></div>
                    ) : (
                      <div className="service-card__icon"><Icon name={sv.icon || "bus"} size={28} /></div>
                    )}
                    <h3>{sv.name}</h3>
                    <p>{sv.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------- Why us ------------------------------ */}
        {data.advantages.length > 0 && (
          <section className="section section--alt" id="why">
            <div className="container">
              <div className="section-head section-head--center reveal">
                <span className="eyebrow">{s("why_label", "Переваги")}</span>
                <h2 className="section-title">{s("why_title", "Чому обирають нас")}</h2>
                <p className="section-sub">{s("why_subtitle", "")}</p>
              </div>
              <div className="adv-grid">
                {data.advantages.map((a) => (
                  <article className="adv-card reveal" key={a.id}>
                    <span className="adv-card__icon"><Icon name={a.icon || "check"} size={24} /></span>
                    <div>
                      <h3>{a.title}</h3>
                      {a.text && <p>{a.text}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* -------------------------------- Steps ------------------------------ */}
        {data.steps.length > 0 && (
          <section className="section" id="how">
            <div className="container">
              <div className="section-head section-head--center reveal">
                <span className="eyebrow">{s("steps_label", "Як замовити")}</span>
                <h2 className="section-title">{s("steps_title", "Як відбувається замовлення")}</h2>
                <p className="section-sub">{s("steps_subtitle", "")}</p>
              </div>
              <div className="steps-grid">
                {data.steps.map((st, i) => (
                  <article className="step-card reveal" key={st.id}>
                    <span className="step-card__num">{i + 1}</span>
                    <div className="step-card__icon"><Icon name={st.icon || "check"} size={30} /></div>
                    <h3>{st.title}</h3>
                    <p>{st.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------------- Universal custom blocks ---------------------- */}
        {customTypes.map((t) => {
          const items = (data.contentItems || []).filter((it) => it.type_slug === t.slug && it.active !== false);
          if (!items.length) return null;
          return (
            <section className="section section--alt" id={`block-${t.slug}`} key={t.id}>
              <div className="container">
                <div className="section-head section-head--center reveal">
                  <span className="eyebrow">Блок</span>
                  <h2 className="section-title">{t.name}</h2>
                  {t.description && <p className="section-sub">{t.description}</p>}
                </div>
                <div className="cards-grid">
                  {items.map((it) => (
                    <article className="service-card reveal" key={it.id}>
                      <div className="service-card__icon"><Icon name={t.icon || "layers"} size={28} /></div>
                      <h3>{it.data?.title || it.data?.name || "Пункт"}</h3>
                      <p>{it.data?.text || it.data?.description || ""}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* -------------------------------- Form ------------------------------- */}
        <section className="section section--alt" id="form" ref={formAnchor}>
          <div className="container form-layout">
            <div className="reveal">
              <span className="eyebrow">{s("form_label", "Заявка")}</span>
              <h2 className="section-title">{s("form_title", "Залиште заявку")}</h2>
              <p className="section-sub">{s("form_subtitle", "")}</p>
              <div className="form-side-list">
                <div className="form-side-item">
                  <IconPhone size={22} />
                  <div><strong>{contacts.phoneDisplay}</strong><span>{contacts.workingHours}</span></div>
                </div>
                <div className="form-side-item">
                  <IconMail size={22} />
                  <div><strong>{contacts.email}</strong><span>Відповідаємо протягом 15 хвилин</span></div>
                </div>
                <div className="form-side-item">
                  <IconMapPin size={22} />
                  <div><strong>{contacts.address}</strong><span>Подача транспорту за адресою</span></div>
                </div>
              </div>
            </div>

            <div className="form-card reveal">
              {status === "success" ? (
                <div className="form-alert form-alert--success" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <IconCheck size={22} />
                  <span>{s("form_success", "Дякуємо! Вашу заявку надіслано.")}</span>
                </div>
              ) : null}

              {status === "error" && <div className="form-alert form-alert--error">{errorText}</div>}

              {status !== "success" && (
                <form onSubmit={submit} noValidate>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="form-name">Ім’я *</label>
                      <input id="form-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ваше ім'я" />
                    </div>
                    <div className="field">
                      <label htmlFor="form-phone">Телефон *</label>
                      <input id="form-phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+380 XX XXX XX XX" />
                    </div>
                    <div className="field">
                      <label htmlFor="form-email">Email</label>
                      <input id="form-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
                    </div>
                    <div className="field">
                      <label htmlFor="form-bus">Автобус</label>
                      <select id="form-bus" value={form.bus} onChange={(e) => setForm({ ...form, bus: e.target.value })}>
                        <option value="">Оберіть транспорт або «не знаю»</option>
                        {data.buses.map((b) => (
                          <option key={b.id} value={`${b.name}${b.seats ? ` (${b.seats} місць)` : ""}`}>
                            {b.name}{b.seats ? ` - ${b.seats} місць` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="form-route">Маршрут</label>
                      <input id="form-route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="Київ - Львів" />
                    </div>
                    <div className="field">
                      <label htmlFor="form-passengers">Кількість пасажирів</label>
                      <input id="form-passengers" value={form.passengers} onChange={(e) => setForm({ ...form, passengers: e.target.value })} placeholder="напр. 25" />
                    </div>
                    <div className="field field--full">
                      <label htmlFor="form-message">Коментар</label>
                      <textarea id="form-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Дата, час подачі, додаткові побажання" />
                    </div>
                  </div>
                  <button className="btn btn--accent btn--lg btn--block" type="submit" disabled={status === "sending"} style={{ marginTop: 18, opacity: status === "sending" ? 0.7 : 1 }}>
                    <IconSend size={18} /> {status === "sending" ? "Надсилаємо..." : s("form_button", "Отримати розрахунок вартості")}
                  </button>
                  <p className="form-note">Натискаючи кнопку, ви погоджуєтесь на обробку даних. Ми не передаємо інформацію третім особам.</p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------- Contacts ---------------------------- */}
        <section className="section" id="contacts">
          <div className="container">
            <div className="section-head section-head--center reveal">
              <span className="eyebrow">{s("contacts_label", "Контакти")}</span>
              <h2 className="section-title">{s("contacts_title", "Зв'яжіться з нами")}</h2>
              <p className="section-sub">{s("contacts_text", "")}</p>
            </div>
            <div className="contacts-grid">
              <div className="contact-card reveal">
                <div className="contact-card__icon"><IconPhone size={24} /></div>
                <span>Телефон</span>
                <strong><a href={links.phone} onClick={() => track("click_phone")}>{contacts.phoneDisplay}</a></strong>
                <strong><a href={links.phone2}>{contacts.phoneDisplay2}</a></strong>
              </div>
              <div className="contact-card reveal">
                <div className="contact-card__icon"><IconMail size={24} /></div>
                <span>Email</span>
                <strong><a href={links.email}>{contacts.email}</a></strong>
              </div>
              <div className="contact-card reveal">
                <div className="contact-card__icon"><IconMapPin size={24} /></div>
                <span>Адреса</span>
                <strong>{contacts.address}</strong>
              </div>
              {links.telegram && (
                <div className="contact-card reveal">
                  <div className="contact-card__icon"><IconTelegram size={24} /></div>
                  <span>Telegram</span>
                  <strong><a href={links.telegram} target="_blank" rel="noreferrer" onClick={() => track("click_telegram")}>{contacts.telegram.replace(/^https?:\/\//i, "").replace(/^@/, "")}</a></strong>
                </div>
              )}
              <div className="contact-card reveal">
                <div className="contact-card__icon"><IconStar size={24} /></div>
                <span>Режим роботи</span>
                <strong>{contacts.workingHours}</strong>
                <div style={{ fontSize: 13.5, color: "#5b6b7f" }}>{contacts.area}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26, justifyContent: "center" }}>
              <a className="btn btn--wa btn--lg" href={links.whatsapp} target="_blank" rel="noreferrer"><IconWhatsApp size={18} color="#fff" /> WhatsApp</a>
              <a className="btn btn--viber btn--lg" href={links.viber} target="_blank" rel="noreferrer"><IconViber size={18} color="#fff" /> Viber</a>
              {links.telegram && <a className="btn btn--tg btn--lg" href={links.telegram} target="_blank" rel="noreferrer"><IconTelegram size={18} color="#fff" /> Telegram</a>}
              <button className="btn btn--accent btn--lg" onClick={() => goToForm()}><IconSend size={16} /> Замовити перевезення</button>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------- Footer ------------------------------- */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div>
              <a className="brand" href="#hero">
                <BrandMark logo={logo} size={26} />
                <span className="brand__text">
                  <strong>{s("company_name", fbCompany)}</strong>
                  <small>{s("header_subtitle", "")}</small>
                </span>
              </a>
              <p style={{ marginTop: 16, maxWidth: 340 }}>{s("footer_text", "")}</p>
              <div className="footer__social">
                <a href={links.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconWhatsApp size={20} color="#fff" /></a>
                <a href={links.viber} target="_blank" rel="noreferrer" aria-label="Viber"><IconViber size={20} color="#fff" /></a>
                {links.telegram && <a href={links.telegram} target="_blank" rel="noreferrer" aria-label="Telegram"><IconTelegram size={20} color="#fff" /></a>}
                <a href={links.phone} aria-label="Телефон"><IconPhone size={19} color="#fff" /></a>
              </div>
            </div>
            <div>
              <h4>Навігація</h4>
              {navItems.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
            </div>
            <div>
              <h4>Послуги</h4>
              {data.services.slice(0, 6).map((sv) => <a key={sv.id} href="#services">{sv.name}</a>)}
            </div>
            <div>
              <h4>Контакти</h4>
              <a href={links.phone}>{contacts.phoneDisplay}</a>
              <a href={links.phone2}>{contacts.phoneDisplay2}</a>
              <a href={links.email}>{contacts.email}</a>
              <a href="#contacts">{contacts.address}</a>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© {new Date().getFullYear()} {s("company_name", fbCompany)}. Усі права захищено.</span>
            <span>{contacts.workingHours} · {contacts.area}</span>
          </div>
        </div>
      </footer>

      {/* ----------------------------- Floating buttons ---------------------- */}
      <div className={`floating ${fabOpen ? "floating--open" : ""}`}>
        <a className="floating__wa" href={links.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" onClick={() => { setFabOpen(false); track("click_whatsapp"); }}><IconWhatsApp size={24} color="#fff" /></a>
        <a className="floating__viber" href={links.viber} target="_blank" rel="noreferrer" aria-label="Viber" onClick={() => { setFabOpen(false); track("click_viber"); }}><IconViber size={24} color="#fff" /></a>
        {links.telegram && <a className="floating__tg" href={links.telegram} target="_blank" rel="noreferrer" aria-label="Telegram" onClick={() => { setFabOpen(false); track("click_telegram"); }}><IconTelegram size={24} color="#fff" /></a>}
        <a className="floating__call" href={links.phone} aria-label="Подзвонити" onClick={() => { setFabOpen(false); track("click_phone"); }}><IconPhone size={22} color="#fff" /></a>
        <button className="floating__top" aria-label="Догори" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setFabOpen(false); }}>
          <span style={{ color: "#fff", display: "grid", placeItems: "center" }}><Icon name="arrow" size={22} /></span>
        </button>
        {/* На телефонах усі кнопки згорнуті в одну, щоб не перекривати форму та контент */}
        <button
          className="floating__toggle"
          aria-label={fabOpen ? "Закрити швидкий зв'язок" : "Швидкий зв'язок"}
          aria-expanded={fabOpen}
          onClick={() => setFabOpen((o) => !o)}
        >
          {fabOpen ? <IconClose size={22} color="#fff" /> : <IconChat size={22} color="#fff" />}
        </button>
      </div>

      {/* --------------------------- Bus gallery modal ----------------------- */}
      {galleryBus && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__overlay" onClick={() => setGalleryBus(null)} />
          <div className="modal__panel">
            <button className="modal__close" onClick={() => setGalleryBus(null)} aria-label="Закрити"><IconClose size={22} /></button>
            <div className="gallery__main">
              {busPhotos(galleryBus).length ? (
                <img src={busPhotos(galleryBus)[activePhoto] || busPhotos(galleryBus)[0]} alt={busCaption(galleryBus, activePhoto) || galleryBus.name} />
              ) : (
                <div style={{ display: "grid", placeItems: "center", height: "100%", color: "rgba(255,255,255,0.3)" }}><IconBus size={120} strokeWidth={1} /></div>
              )}
            </div>
            {busCaption(galleryBus, activePhoto) && (
              <div className="gallery__caption">{busCaption(galleryBus, activePhoto)}</div>
            )}
            {busPhotos(galleryBus).length > 1 && (
              <div className="gallery__thumbs">
                {busPhotos(galleryBus).map((p: string, i: number) => (
                  <div key={p + i} className={`gallery__thumb ${i === activePhoto ? "gallery__thumb--active" : ""}`} onClick={() => setActivePhoto(i)}
                    title={busCaption(galleryBus, i) || `Фото ${i + 1}`}>
                    <img src={p} alt={busCaption(galleryBus, i) || ""} />
                  </div>
                ))}
              </div>
            )}
            <div className="modal__body">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: 26 }}>{galleryBus.name}</h2>
                  <div className="bus-card__model">{[galleryBus.brand, galleryBus.model].filter(Boolean).join(" · ")}{galleryBus.year ? ` · ${galleryBus.year}` : ""}</div>
                </div>
                <div className="bus-card__price" style={{ textAlign: "right" }}>
                  <strong>{galleryBus.price ? `від ${galleryBus.price} €` : "за запитом"}</strong>
                  <span> / {priceUnit(galleryBus.price_unit)}</span>
                </div>
              </div>

              <div className="modal__specs">
                <div className="modal__spec"><span>Тип</span><strong>{galleryBus.bus_type || "-"}</strong></div>
                <div className="modal__spec"><span>Місць</span><strong>{galleryBus.seats || "-"}</strong></div>
                <div className="modal__spec"><span>Рік</span><strong>{galleryBus.year || "-"}</strong></div>
                <div className="modal__spec"><span>Марка</span><strong>{galleryBus.brand || "-"}</strong></div>
              </div>

              {galleryBus.description && <p style={{ color: "#4a5b70" }}>{galleryBus.description}</p>}

              {Array.isArray(galleryBus.specs) && galleryBus.specs.length > 0 && (
                <div className="bus-card__specs" style={{ marginTop: 16 }}>
                  {galleryBus.specs.map((sp: string) => <span className="chip" key={sp}>{sp}</span>)}
                </div>
              )}

              {galleryBus.rental_terms && <div className="bus-card__terms" style={{ marginTop: 16 }}>Умови оренди: {galleryBus.rental_terms}</div>}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
                <button className="btn btn--accent btn--lg" onClick={() => { setGalleryBus(null); goToForm(`${galleryBus.name}${galleryBus.seats ? ` (${galleryBus.seats} місць)` : ""}`); }}>
                  <IconSend size={16} /> Замовити цей транспорт
                </button>
                <a className="btn btn--wa btn--lg" href={links.whatsapp} target="_blank" rel="noreferrer"><IconWhatsApp size={18} color="#fff" /> Запитати у WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
