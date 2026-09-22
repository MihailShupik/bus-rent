import LandingPage from "@/components/LandingPage";
import { getSiteData } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialData = null;
  try {
    initialData = await getSiteData();
  } catch (e) {
    console.error("Server data fetch failed:", e);
  }
  return <LandingPage initialData={initialData} />;
}
