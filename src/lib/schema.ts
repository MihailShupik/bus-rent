import sql from "./db";
import { hashPassword } from "./auth";

/**
 * Creates every table the site needs. Safe to run repeatedly (idempotent).
 * Works on any Postgres: Neon, Supabase, Vercel Postgres, local.
 */
export async function ensureSchema() {
  await sql(`CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS buses (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    brand TEXT DEFAULT '',
    model TEXT DEFAULT '',
    seats INT DEFAULT 0,
    year INT,
    bus_type TEXT DEFAULT '',
    description TEXT DEFAULT '',
    specs TEXT[] DEFAULT '{}',
    rental_terms TEXT DEFAULT '',
    price TEXT DEFAULT '',
    price_unit TEXT DEFAULT 'година',
    photos TEXT[] DEFAULT '{}',
    main_photo TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'bus',
    image TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS advantages (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    text TEXT DEFAULT '',
    icon TEXT DEFAULT 'check',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS steps (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'check',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    bus TEXT DEFAULT '',
    route TEXT DEFAULT '',
    passengers TEXT DEFAULT '',
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data TEXT DEFAULT '',
    page_url TEXT DEFAULT '',
    referrer TEXT DEFAULT '',
    utm_source TEXT DEFAULT '',
    utm_medium TEXT DEFAULT '',
    utm_campaign TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await sql(`CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events (event_type)`);

  await sql(`CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    filename TEXT DEFAULT '',
    mime TEXT DEFAULT 'image/jpeg',
    size INT DEFAULT 0,
    data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  /* ------------------ Universal content engine ------------------ */
  await sql(`CREATE TABLE IF NOT EXISTS content_types (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'layers',
    fields JSONB DEFAULT '[]',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await sql(`CREATE TABLE IF NOT EXISTS content_items (
    id SERIAL PRIMARY KEY,
    type_slug TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await sql(`CREATE INDEX IF NOT EXISTS idx_items_type ON content_items (type_slug)`);

  // Lightweight migrations for older installs
  await sql(`ALTER TABLE buses ADD COLUMN IF NOT EXISTS rental_terms TEXT DEFAULT ''`).catch(() => {});
  await sql(`ALTER TABLE buses ADD COLUMN IF NOT EXISTS bus_type TEXT DEFAULT ''`).catch(() => {});
  await sql(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS route TEXT DEFAULT ''`).catch(() => {});
  await sql(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS passengers TEXT DEFAULT ''`).catch(() => {});

  // Default admin account (credentials configurable via env)
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@bus-rent.ua").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "busrent2026";
  const existing = await sql(`SELECT id FROM admin_users WHERE email = $1`, [adminEmail]);
  if (!existing.length) {
    await sql(`INSERT INTO admin_users (email, password_hash) VALUES ($1,$2) ON CONFLICT (email) DO NOTHING`, [
      adminEmail,
      hashPassword(adminPass),
    ]);
  }
}
