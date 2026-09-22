import type { Metadata } from "next";
import "./globals.css";
import { getSiteMeta } from "@/lib/content";

const FALLBACK_TITLE = "BusRent | Оренда автобусів і мікроавтобусів з водієм";
const FALLBACK_DESCRIPTION =
  "Пасажирські перевезення, оренда автобусів і мікроавтобусів, трансфери, міжміські та корпоративні перевезення. Подача за адресою, досвідчені водії, працюємо 24/7.";

/** SEO-поля та логотип редагуються в адмінці: Налаштування → SEO / Загальне. */
export async function generateMetadata(): Promise<Metadata> {
  let meta: Record<string, string> = {};
  try {
    meta = await getSiteMeta();
  } catch {
    meta = {};
  }

  const title = meta.seo_title || FALLBACK_TITLE;
  const description = meta.seo_description || FALLBACK_DESCRIPTION;
  const icon = meta.logo_image || "/favicon.svg";

  return {
    title,
    description,
    keywords: ["оренда автобуса", "оренда мікроавтобуса", "пасажирські перевезення", "трансфер", "автобус з водієм"],
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "uk_UA",
      images: meta.hero_image ? [{ url: meta.hero_image }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>
        {/* Without JavaScript every scroll-reveal section must stay visible. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
