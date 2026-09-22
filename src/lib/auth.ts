import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import sql from "./db";

const SECRET = process.env.JWT_SECRET || "bus-rent-secret-change-me";

/**
 * Password format: scrypt$<saltHex>$<hashHex>
 * Legacy sha256 hashes (plain hex) are still accepted for backwards compatibility.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function checkPassword(password: string, stored: string): boolean {
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    const derived = scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(derived, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  // legacy sha256
  const legacy = createHash("sha256").update(password).digest("hex");
  return legacy === stored;
}

// Token: base64url( email + ":" + expiry + ":" + signature )
export function generateToken(email: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = `${email}:${expiry}`;
  const sig = createHash("sha256").update(data + ":" + SECRET).digest("hex").slice(0, 16);
  return Buffer.from(`${data}:${sig}`).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const sig = decoded.slice(lastColon + 1);
    const data = decoded.slice(0, lastColon);
    const expectedSig = createHash("sha256").update(data + ":" + SECRET).digest("hex").slice(0, 16);
    if (sig !== expectedSig) return null;
    const parts = data.split(":");
    const email = parts.slice(0, -1).join(":");
    const expiry = parseInt(parts[parts.length - 1]);
    if (isNaN(expiry) || Date.now() > expiry) return null;
    return email;
  } catch {
    return null;
  }
}

export async function verifyLogin(email: string, password: string): Promise<boolean> {
  const rows = await sql(`SELECT password_hash FROM admin_users WHERE email = $1`, [email]);
  if (!rows.length) return false;
  return checkPassword(password, rows[0].password_hash);
}

export function getAuthToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function requireAuth(request: Request): string | null {
  const token = getAuthToken(request);
  if (!token) return null;
  return verifyToken(token);
}
