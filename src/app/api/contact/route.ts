import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { formatLead, notifyAdmins } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const phoneRegex = /^[0-9+()\s-]{8,22}$/;
const norm = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = norm(body.name);
    const phone = norm(body.phone);
    const email = norm(body.email);
    const bus = norm(body.bus);
    const route = norm(body.route);
    const passengers = norm(body.passengers);
    const message = norm(body.message || body.comment);

    if (!name || !phone) {
      return NextResponse.json({ error: "Ім'я та телефон обов'язкові." }, { status: 400 });
    }
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Невірний формат телефону. Використовуйте лише цифри та символи + ( ) -" }, { status: 400 });
    }

    await ensureSchema();

    try {
      await sql(
        `INSERT INTO applications (name, phone, email, bus, route, passengers, message, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new')`,
        [name, phone, email, bus, route, passengers, message]
      );
    } catch (dbError) {
      console.error("DB save error:", dbError);
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      const lines = [
        "<b>Нова заявка з сайту оренди автобусів</b>",
        `<b>Ім'я:</b> ${name}`,
        `<b>Телефон:</b> ${phone}`,
        email ? `<b>Email:</b> ${email}` : "",
        bus ? `<b>Транспорт:</b> ${bus}` : "",
        route ? `<b>Маршрут:</b> ${route}` : "",
        passengers ? `<b>Пасажирів:</b> ${passengers}` : "",
        message ? `<b>Коментар:</b> ${message}` : "",
        `<b>Час:</b> ${new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}`,
      ].filter(Boolean);
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" }),
        });
      } catch (tgError) {
        console.error("Telegram error:", tgError);
      }
    }

    // Notify every registered bot administrator (site_settings token or env).
    try {
      await notifyAdmins(formatLead({ name, phone, email, bus, route, passengers, message }));
    } catch (tgError) {
      console.error("Telegram admins notify error:", tgError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Внутрішня помилка сервера." }, { status: 500 });
  }
}
