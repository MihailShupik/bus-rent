import sql from "./db";
import { ensureSchema } from "./schema";
import { defaultAdvantages, defaultBuses, defaultContentItems, defaultContentTypes, defaultServices, defaultSettings, defaultSteps, defaultTelegramAdmins } from "./seed-data";

export type SiteData = {
  settings: Record<string, string>;
  buses: any[];
  services: any[];
  advantages: any[];
  steps: any[];
  contentTypes: any[];
  contentItems: any[];
};

/** Ідемпотентно додає адміністраторів Telegram-бота (працює і на наявних базах). */
export async function ensureTelegramAdmins() {
  for (const a of defaultTelegramAdmins) {
    await sql(
      `INSERT INTO telegram_admins (name, telegram_id, role, active) VALUES ($1,$2,$3,true)
       ON CONFLICT (telegram_id) DO NOTHING`,
      [a.name, a.telegram_id, a.role]
    );
  }
}

/**
 * Ensures every settings key exists. Missing keys are added with their default
 * value; existing keys are left untouched so the client's edits are never
 * overwritten. With `force` the default values are written over the current ones.
 *
 * Runs on every bootstrap, including databases that already have content — this
 * is how newly added admin fields reach an existing installation.
 */
export async function ensureSettingsKeys(force = false) {
  for (const [key, value] of Object.entries(defaultSettings)) {
    if (force) {
      await sql(
        `INSERT INTO site_settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      );
    } else {
      await sql(
        `INSERT INTO site_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }
  }
}

export async function seedDatabase(force = false) {
  // Always idempotent, even for databases that already have content.
  await ensureTelegramAdmins();
  await ensureSettingsKeys(force);

  const existing = await sql(`SELECT COUNT(*)::int AS c FROM buses`);
  if (!force && existing[0]?.c > 0) {
    return { skipped: true };
  }

  for (const [i, b] of defaultBuses.entries()) {
    await sql(
      `INSERT INTO buses (slug,name,brand,model,seats,year,bus_type,description,specs,rental_terms,price,price_unit,photos,main_photo,sort_order,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'{}','',$13,true)
       ON CONFLICT (slug) DO NOTHING`,
      [b.slug, b.name, b.brand, b.model, b.seats, b.year, b.bus_type, b.description, b.specs, b.rental_terms, b.price, b.price_unit, i]
    );
  }

  for (const [i, s] of defaultServices.entries()) {
    await sql(
      `INSERT INTO services (slug,name,description,icon,image,sort_order,active)
       VALUES ($1,$2,$3,$4,'',$5,true) ON CONFLICT (slug) DO NOTHING`,
      [s.slug, s.name, s.description, s.icon, i]
    );
  }

  const advCount = await sql(`SELECT COUNT(*)::int AS c FROM advantages`);
  if (advCount[0]?.c === 0) {
    for (const [i, a] of defaultAdvantages.entries()) {
      await sql(`INSERT INTO advantages (title,text,icon,sort_order) VALUES ($1,$2,$3,$4)`, [a.title, a.text, a.icon, i]);
    }
  }

  const stepCount = await sql(`SELECT COUNT(*)::int AS c FROM steps`);
  if (stepCount[0]?.c === 0) {
    for (const [i, s] of defaultSteps.entries()) {
      await sql(`INSERT INTO steps (title,description,icon,sort_order) VALUES ($1,$2,$3,$4)`, [s.title, s.description, s.icon, i]);
    }
  }

  // Universal content engine: example block + its items
  for (const t of defaultContentTypes) {
    await sql(
      `INSERT INTO content_types (slug,name,description,icon,fields,sort_order,active)
       VALUES ($1,$2,$3,$4,$5,$6,true) ON CONFLICT (slug) DO NOTHING`,
      [t.slug, t.name, t.description, t.icon, JSON.stringify(t.fields), 0]
    );
  }
  const itemsCount = await sql(`SELECT COUNT(*)::int AS c FROM content_items`);
  if (itemsCount[0]?.c === 0) {
    for (const [i, it] of defaultContentItems.entries()) {
      await sql(`INSERT INTO content_items (type_slug,data,sort_order,active) VALUES ($1,$2,$3,true)`, [
        it.type_slug,
        JSON.stringify(it.data),
        i,
      ]);
    }
  }

  // Telegram bot administrators (receive site leads)
  await ensureTelegramAdmins();

  return { skipped: false };
}

/**
 * Runs the schema/seed bootstrap exactly once per server process.
 *
 * Previously every request executed ~25 sequential DDL/seed statements, which
 * made a remote database (Neon) take seconds under parallel load. Now the work
 * happens once and every later request reuses the resolved promise.
 */
// State lives on globalThis: in Next.js every route handler and page bundle has
// its own module instances, so a module-level variable would be duplicated
// (the bootstrap would run once per bundle instead of once per process).
const g = globalThis as unknown as {
  __busrentInit?: Promise<void>;
  __busrentMeta?: { at: number; data: Record<string, string> };
};

export function ensureInitialized(): Promise<void> {
  if (!g.__busrentInit) {
    g.__busrentInit = (async () => {
      await ensureSchema();
      await seedDatabase();
    })().catch((e) => {
      // Allow a retry on the next request if the database was temporarily down.
      g.__busrentInit = undefined;
      throw e;
    });
  }
  return g.__busrentInit;
}
export async function getSiteData(includeInactive = false): Promise<SiteData> {
  await ensureInitialized();

  // One round trip instead of seven: the database aggregates every collection
  // into JSON. Matters a lot when the database is remote (Neon/Supabase).
  const filter = includeInactive ? "" : " WHERE active = true";
  const rows = await sql(`
    SELECT
      (SELECT COALESCE(json_object_agg(key, value), '{}'::json) FROM site_settings) AS settings,
      (SELECT COALESCE(json_agg(b ORDER BY b.sort_order, b.id), '[]'::json) FROM buses b${filter}) AS buses,
      (SELECT COALESCE(json_agg(s ORDER BY s.sort_order, s.id), '[]'::json) FROM services s${filter}) AS services,
      (SELECT COALESCE(json_agg(a ORDER BY a.sort_order, a.id), '[]'::json) FROM advantages a${filter}) AS advantages,
      (SELECT COALESCE(json_agg(st ORDER BY st.sort_order, st.id), '[]'::json) FROM steps st${filter}) AS steps,
      (SELECT COALESCE(json_agg(ct ORDER BY ct.sort_order, ct.id), '[]'::json) FROM content_types ct${filter}) AS "contentTypes",
      (SELECT COALESCE(json_agg(ci ORDER BY ci.sort_order, ci.id), '[]'::json) FROM content_items ci${filter}) AS "contentItems"
  `);

  const r: any = rows[0] || {};
  return {
    settings: r.settings || {},
    buses: r.buses || [],
    services: r.services || [],
    advantages: r.advantages || [],
    steps: r.steps || [],
    contentTypes: r.contentTypes || [],
    contentItems: r.contentItems || [],
  };
}

/**
 * Lightweight, cached lookup for <head> metadata (SEO title/description, logo).
 * Kept separate from getSiteData so static pages do not run schema/seed work.
 */
/** Скидає кеш метаданих (викликається після збереження налаштувань). */
export function invalidateSiteMeta() {
  g.__busrentMeta = undefined;
}

export async function getSiteMeta(ttlMs = 30_000): Promise<Record<string, string>> {
  const cached = g.__busrentMeta;
  if (cached && Date.now() - cached.at < ttlMs) return cached.data;

  const query = () =>
    sql(
      `SELECT key, value FROM site_settings
       WHERE key IN ('seo_title','seo_description','company_name','logo_image','hero_image')`
    );

  let rows: any[] = [];
  try {
    rows = await query();
  } catch {
    // Fresh database: create the schema once, then retry.
    try {
      await ensureSchema();
      rows = await query();
    } catch {
      return {};
    }
  }

  const map: Record<string, string> = {};
  rows.forEach((r: any) => (map[r.key] = r.value));
  g.__busrentMeta = { at: Date.now(), data: map };
  return map;
}
