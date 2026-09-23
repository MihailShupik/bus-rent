import { describe, expect, it } from "vitest";
import { currencySymbol, resolveCurrency, DEFAULT_CURRENCY } from "./currencies";

describe("currencySymbol", () => {
  it("maps known codes to symbols", () => {
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("UAH")).toBe("₴");
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("PLN")).toBe("zł");
  });
  it("is case insensitive", () => {
    expect(currencySymbol("uah")).toBe("₴");
  });
  it("returns the raw value for unknown codes", () => {
    expect(currencySymbol("XYZ")).toBe("XYZ");
  });
  it("falls back to the default symbol when empty", () => {
    expect(currencySymbol("")).toBe("₴");
    expect(currencySymbol(null)).toBe("₴");
    expect(currencySymbol(undefined)).toBe(currencySymbol(DEFAULT_CURRENCY));
  });
});

describe("resolveCurrency", () => {
  it("prefers the custom value", () => {
    expect(resolveCurrency({ currency: "USD", currency_custom: "грн" }, "EUR")).toBe("грн");
  });
  it("uses the selected code", () => {
    expect(resolveCurrency({ currency: "UAH" }, "EUR")).toBe("₴");
  });
  it("falls back to the site default", () => {
    expect(resolveCurrency({ currency: "" }, "USD")).toBe("$");
  });
  it("falls back to the default currency when nothing is set", () => {
    expect(resolveCurrency({}, "")).toBe("₴");
    expect(resolveCurrency(undefined, undefined)).toBe("₴");
  });
});
