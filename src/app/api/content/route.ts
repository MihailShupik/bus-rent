import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSiteData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=15, s-maxage=30" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
