import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureInitialized } from "@/lib/content";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_SIZE = 12 * 1024 * 1024; // 12MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];

export async function POST(request: Request) {
  try {
    // Only signed-in administrators may upload files.
    if (!requireAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Файл завеликий. Максимум 12MB." }, { status: 413 });
    }
    const mime = file.type || "image/jpeg";
    if (!ALLOWED.includes(mime)) {
      return NextResponse.json({ error: "Дозволені лише зображення (jpg, png, webp, gif, avif, svg)." }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    await ensureInitialized();
    const rows = await sql(
      `INSERT INTO media (filename, mime, size, data) VALUES ($1,$2,$3,$4) RETURNING id`,
      [file.name || "photo.jpg", mime, file.size, base64]
    );

    return NextResponse.json({ success: true, url: `/api/media/${rows[0].id}`, id: rows[0].id });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
