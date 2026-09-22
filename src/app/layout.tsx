import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BusRent | Оренда автобусів і мікроавтобусів з водієм",
  description:
    "Пасажирські перевезення, оренда автобусів і мікроавтобусів, трансфери, міжміські та корпоративні перевезення. Подача за адресою, досвідчені водії, працюємо 24/7.",
  keywords: ["оренда автобуса", "оренда мікроавтобуса", "пасажирські перевезення", "трансфер", "автобус з водієм"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    title: "BusRent | Оренда автобусів і мікроавтобусів з водієм",
    description: "Комфортабельні автобуси та мікроавтобуси для міста, міжміських рейсів, трансферів і заходів.",
    type: "website",
    locale: "uk_UA",
  },
  robots: { index: true, follow: true },
};

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
