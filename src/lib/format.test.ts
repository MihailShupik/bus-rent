import { describe, expect, it } from "vitest";
import { fieldKey, isValidPhone, mainPhotoOf, photoGallery, priceLabel, priceUnit, slugify } from "./format";

describe("slugify", () => {
  it("creates url-safe slugs from latin text", () => {
    expect(slugify("Mercedes-Benz Sprinter 519")).toBe("mercedes-benz-sprinter-519");
  });
  it("keeps ukrainian letters", () => {
    expect(slugify("Оренда автобуса")).toBe("оренда-автобуса");
  });
  it("collapses spaces and trims dashes", () => {
    expect(slugify("  -a   b-  ")).toBe("a-b");
  });
  it("handles empty input", () => {
    expect(slugify("")).toBe("");
    expect(slugify(undefined as any)).toBe("");
  });
});

describe("fieldKey", () => {
  it("produces snake_case keys for custom fields", () => {
    expect(fieldKey("Питання клієнта")).toBe("питання_клієнта");
    expect(fieldKey("Some Field-Name")).toBe("some_field_name");
  });
});

describe("priceUnit", () => {
  it("accepts known units", () => {
    expect(priceUnit("день")).toBe("день");
    expect(priceUnit("км")).toBe("км");
  });
  it("falls back to година for unknown values", () => {
    expect(priceUnit("тиждень")).toBe("година");
    expect(priceUnit(null)).toBe("година");
    expect(priceUnit(undefined)).toBe("година");
  });
});

describe("priceLabel", () => {
  it("renders a price with unit", () => {
    expect(priceLabel("80", "година")).toBe("від 80 € / година");
  });
  it("uses the given currency symbol", () => {
    expect(priceLabel("2500", "день", "₴")).toBe("від 2500 ₴ / день");
    expect(priceLabel("120", "година", "$")).toBe("від 120 $ / година");
  });
  it("returns a fallback when the price is empty", () => {
    expect(priceLabel("", "день")).toBe("за запитом");
    expect(priceLabel(null, null)).toBe("за запитом");
  });
});

describe("photos", () => {
  const bus = { main_photo: "/b.jpg", photos: ["/a.jpg", "/b.jpg", "/c.jpg"] };
  it("prefers the explicit main photo", () => {
    expect(mainPhotoOf(bus)).toBe("/b.jpg");
  });
  it("falls back to the first photo", () => {
    expect(mainPhotoOf({ photos: ["/x.jpg"] })).toBe("/x.jpg");
  });
  it("returns empty string without photos", () => {
    expect(mainPhotoOf({ photos: [] })).toBe("");
    expect(mainPhotoOf(null)).toBe("");
  });
  it("builds a gallery with the main photo first and no duplicates", () => {
    expect(photoGallery(bus)).toEqual(["/b.jpg", "/a.jpg", "/c.jpg"]);
    expect(photoGallery({ photos: ["/a.jpg"] })).toEqual(["/a.jpg"]);
  });
});

describe("isValidPhone", () => {
  it("accepts common formats", () => {
    expect(isValidPhone("+380 44 123 45 67")).toBe(true);
    expect(isValidPhone("(044)123-45-67")).toBe(true);
  });
  it("rejects garbage", () => {
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});
