import Script from "next/script";
import LandingPage from "@/components/LandingPage";
import { getSiteData } from "@/lib/content";

export const dynamic = "force-dynamic";

/** Google Ads (gtag.js). Тег вантажимо лише на публічний лендинг, не в адмінку. */
const GOOGLE_ADS_ID = "AW-18199730227";

export default async function Home() {
  let initialData = null;
  try {
    initialData = await getSiteData();
  } catch (e) {
    console.error("Server data fetch failed:", e);
  }
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        id="google-ads-gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
      <LandingPage initialData={initialData} />
    </>
  );
}
