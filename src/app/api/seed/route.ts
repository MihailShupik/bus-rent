import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema";
import { seedDatabase } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "1";
    const result = await seedDatabase(force);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
