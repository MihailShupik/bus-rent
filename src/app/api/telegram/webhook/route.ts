import { NextResponse } from "next/server";
import { ensureInitialized } from "@/lib/content";
import { getWebhookSecret, handleTelegramUpdate } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Telegram sends updates here (set via the admin panel → "Підключити webhook"). */
export async function POST(request: Request) {
  try {
    await ensureInitialized();

    // If a secret is configured, Telegram must present it.
    const secret = await getWebhookSecret();
    if (secret) {
      const header = request.headers.get("x-telegram-bot-api-secret-token");
      if (header !== secret) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 401 });
      }
    }

    const update = await request.json();
    const result = await handleTelegramUpdate(update);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Telegram webhook error:", e);
    // Always answer 200 so Telegram does not retry endlessly.
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, info: "Telegram webhook endpoint" });
}
