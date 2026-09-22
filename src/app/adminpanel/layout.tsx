"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./admin.css";
import {
  Icon, IconBus, IconGrid, IconInbox, IconLayers, IconLogout, IconMenu, IconSettings, IconStar,
  IconTrend, IconUsers,
} from "@/components/icons";
import { ToastProvider } from "@/components/admin/ui";

const NAV = [
  { group: "Огляд" },
  { href: "/adminpanel/dashboard", label: "Дашборд", icon: "grid" },
  { href: "/adminpanel/applications", label: "Заявки", icon: "inbox" },
  { group: "Каталог" },
  { href: "/adminpanel/buses", label: "Автобуси", icon: "bus" },
  { href: "/adminpanel/services", label: "Послуги", icon: "layers" },
  { group: "Контент" },
  { href: "/adminpanel/advantages", label: "Переваги", icon: "star" },
  { href: "/adminpanel/steps", label: "Кроки замовлення", icon: "trend" },
  { href: "/adminpanel/builder", label: "Конструктор блоків", icon: "layers" },
  { group: "Система" },
  { href: "/adminpanel/settings", label: "Налаштування", icon: "settings" },
];

const ICONS: Record<string, (p: any) => React.ReactElement> = {
  grid: IconGrid, inbox: IconInbox, bus: IconBus, layers: IconLayers, star: IconStar,
  trend: IconTrend, settings: IconSettings, users: IconUsers,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/adminpanel/login";

  useEffect(() => {
    if (isLogin) return;
    let cancelled = false;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/adminpanel/login");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/verify?token=" + encodeURIComponent(token));
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) {
          setAuthed(true);
          setEmail(data.email || "");
        } else {
          localStorage.removeItem("admin_token");
          router.push("/adminpanel/login");
        }
      } catch {
        if (!cancelled) router.push("/adminpanel/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLogin, router]);

  if (isLogin) return <ToastProvider>{children}</ToastProvider>;
  if (loading) return <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "#64748b" }}>Завантаження...</div>;
  if (!authed) return null;

  const active = NAV.find((n: any) => n.href && pathname.startsWith(n.href)) as any;

  return (
    <ToastProvider>
      <div className="a-shell">
        {open && <div className="a-overlay" onClick={() => setOpen(false)} />}
        <aside className={`a-side ${open ? "open" : ""}`}>
          <div className="a-side__head">
            <span className="a-side__logo"><IconBus size={22} /></span>
            <span className="a-side__title">BusRent<small>Адмін-панель</small></span>
          </div>
          <nav className="a-nav">
            {NAV.map((n: any, i) =>
              n.group ? (
                <div className="a-nav__group" key={`g${i}`}>{n.group}</div>
              ) : (
                <a key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "on" : ""}
                  onClick={(e) => { e.preventDefault(); setOpen(false); router.push(n.href); }}>
                  {ICONS[n.icon] ? (() => { const C = ICONS[n.icon]; return <C size={19} />; })() : <Icon name={n.icon} size={19} />}
                  {n.label}
                </a>
              )
            )}
          </nav>
          <div className="a-side__foot">
            <button onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/adminpanel/login"; }}>
              <IconLogout size={18} /> Вийти
            </button>
          </div>
        </aside>

        <div className="a-main">
          <header className="a-top">
            <div className="a-row">
              <button className="a-burger" onClick={() => setOpen(true)} aria-label="Меню"><IconMenu size={24} /></button>
              <h1>{active?.label || "Адмін-панель"}</h1>
            </div>
            <div className="a-top__right">
              <a className="a-btn a-btn--ghost a-btn--sm" href="/" target="_blank" rel="noreferrer">Відкрити сайт</a>
              <span className="a-avatar">{(email[0] || "A").toUpperCase()}</span>
            </div>
          </header>
          <div className="a-body">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
