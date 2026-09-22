/** Pure helpers shared by the site and the admin panel (unit-tested). */

/** Turns any text into a url-safe slug (supports Cyrillic input). */
export function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slug for database field keys: letters (any alphabet), digits and underscore. */
export function fieldKey(value: string): string {
  return slugify(value)
    .replace(/-+/g, "_")
    .replace(/[^\p{L}\p{N}_]+/gu, "");
}

const UNITS = ["година", "день", "поїздка", "км"] as const;
export type PriceUnit = (typeof UNITS)[number];

/** Normalises an arbitrary price unit coming from the database. */
export function priceUnit(unit?: string | null): string {
  const u = String(unit || "").trim().toLowerCase();
  return (UNITS as readonly string[]).includes(u) ? u : "година";
}

/** Human readable price, e.g. "від 80 € / година". */
export function priceLabel(price?: string | number | null, unit?: string | null): string {
  const p = price === null || price === undefined ? "" : String(price).trim();
  if (!p) return "за запитом";
  return `від ${p} € / ${priceUnit(unit)}`;
}

/** Returns the main photo, or the first gallery photo, or "". */
export function mainPhotoOf(item: { main_photo?: string; photos?: string[] } | null | undefined): string {
  if (!item) return "";
  const photos = Array.isArray(item.photos) ? item.photos.filter(Boolean) : [];
  if (item.main_photo) {
    return item.main_photo;
  }
  return photos[0] || "";
}

/** Gallery list: main photo first, then the rest, without duplicates. */
export function photoGallery(item: { main_photo?: string; photos?: string[] } | null | undefined): string[] {
  if (!item) return [];
  const photos = Array.isArray(item.photos) ? item.photos.filter(Boolean) : [];
  const main = item.main_photo || photos[0] || "";
  const rest = photos.filter((p) => p !== main);
  return main ? [main, ...rest] : rest;
}

/** Validates a phone number typed by a customer. */
export function isValidPhone(phone: string): boolean {
  return /^[0-9+()\s-]{8,22}$/.test(String(phone || "").trim());
}
