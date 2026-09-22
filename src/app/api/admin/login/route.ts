import { NextResponse } from "next/server";
import { generateToken, verifyLogin } from "@/lib/auth";
import { ensureInitialized } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email та пароль обов'язкові" }, { status: 400 });
    }
    await ensureInitialized();
    const cleanEmail = String(email).trim().toLowerCase();
    const valid = await verifyLogin(cleanEmail, password);
    if (!valid) return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });

    const token = generateToken(cleanEmail);
    const response = NextResponse.json({ token, email: cleanEmail });
    response.headers.set(
      "Set-Cookie",
      `admin_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
    );
    return response;
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
