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
  const icon = "/favicon.png";

  return {
    title,
    description,
    keywords: ["оренда автобуса", "оренда мікроавтобуса", "пасажирські перевезення", "трансфер", "автобус з водієм"],
    icons: { icon, shortcut: icon, apple: "/apple-touch-icon.png" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "uk_UA",
      images: meta.hero_image
        ? [{ url: meta.hero_image }]
        : [{ url: "/og-image.png", width: 1200, height: 630, alt: "BusRent — оренда автобусів" }],
    },
    robots: { index: true, follow: true },
    // маркер збірки: допомагає одразу зрозуміти, яку саме версію бачить клієнт
    other: { "br-build": (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7) },
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
