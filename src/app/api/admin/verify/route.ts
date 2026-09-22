import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const queryToken = url.searchParams.get("token");
  if (queryToken) {
    const email = verifyToken(queryToken);
    if (email) return NextResponse.json({ valid: true, email, via: "query" });
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const email = verifyToken(auth.slice(7));
    if (email) return NextResponse.json({ valid: true, email, via: "header" });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
  );
  if (cookies["admin_token"]) {
    const email = verifyToken(cookies["admin_token"]);
    if (email) return NextResponse.json({ valid: true, email, via: "cookie" });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
