import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    return NextResponse.json({ success: true, message: "Database schema is ready" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
