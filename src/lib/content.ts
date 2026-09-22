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

export async function seedDatabase(force = false) {
  // Always idempotent, even for databases that already have content.
  await ensureTelegramAdmins();

  const existing = await sql(`SELECT COUNT(*)::int AS c FROM buses`);
  const settingsCount = await sql(`SELECT COUNT(*)::int AS c FROM site_settings`);
  if (!force && existing[0]?.c > 0 && settingsCount[0]?.c > 0) {
    return { skipped: true };
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    await sql(
      `INSERT INTO site_settings (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
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

export async function getSiteData(includeInactive = false): Promise<SiteData> {
  await ensureSchema();
  await seedDatabase();

  const active = includeInactive ? "" : "WHERE active = true";
  const [settings, buses, services, advantages, steps, contentTypes, contentItems] = await Promise.all([
    sql(`SELECT key, value FROM site_settings`),
    sql(`SELECT * FROM buses ${active} ORDER BY sort_order ASC, id ASC`),
    sql(`SELECT * FROM services ${active} ORDER BY sort_order ASC, id ASC`),
    sql(`SELECT * FROM advantages ${active} ORDER BY sort_order ASC, id ASC`),
    sql(`SELECT * FROM steps ${active} ORDER BY sort_order ASC, id ASC`),
    sql(`SELECT * FROM content_types ${active} ORDER BY sort_order ASC, id ASC`),
    sql(`SELECT * FROM content_items ${active} ORDER BY sort_order ASC, id ASC`),
  ]);

  const settingsMap: Record<string, string> = {};
  (settings as any[]).forEach((s) => (settingsMap[s.key] = s.value));

  return { settings: settingsMap, buses, services, advantages, steps, contentTypes, contentItems };
}
