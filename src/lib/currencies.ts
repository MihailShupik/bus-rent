/** Довідник валют: код, символ і назва для адмінки та сайту. */
export type Currency = { code: string; symbol: string; label: string };

export const CURRENCIES: Currency[] = [
  { code: "EUR", symbol: "€", label: "Євро" },
  { code: "UAH", symbol: "₴", label: "Гривня" },
  { code: "USD", symbol: "$", label: "Долар США" },
  { code: "PLN", symbol: "zł", label: "Польський злотий" },
  { code: "CZK", symbol: "Kč", label: "Чеська крона" },
  { code: "GBP", symbol: "£", label: "Фунт стерлінгів" },
  { code: "CHF", symbol: "CHF", label: "Швейцарський франк" },
  { code: "TRY", symbol: "₺", label: "Турецька ліра" },
  { code: "MDL", symbol: "L", label: "Молдовський лей" },
  { code: "RON", symbol: "lei", label: "Румунський лей" },
  { code: "HUF", symbol: "Ft", label: "Угорський форинт" },
  { code: "SEK", symbol: "kr", label: "Шведська крона" },
  { code: "NOK", symbol: "kr", label: "Норвезька крона" },
  { code: "DKK", symbol: "kr", label: "Данська крона" },
  { code: "GEL", symbol: "₾", label: "Грузинський ларі" },
  { code: "KZT", symbol: "₸", label: "Казахстанський тенге" },
  { code: "AED", symbol: "AED", label: "Дірхам ОАЕ" },
  { code: "ILS", symbol: "₪", label: "Ізраїльський шекель" },
  { code: "CAD", symbol: "C$", label: "Канадський долар" },
  { code: "AUD", symbol: "A$", label: "Австралійський долар" },
  { code: "JPY", symbol: "¥", label: "Японська єна" },
  { code: "CNY", symbol: "¥", label: "Китайський юань" },
];

export const DEFAULT_CURRENCY = "EUR";

/** Символ валюти за кодом (якщо код невідомий — повертаємо його самого). */
export function currencySymbol(code?: string | null): string {
  const c = String(code || "").trim();
  if (!c) return CURRENCIES.find((x) => x.code === DEFAULT_CURRENCY)!.symbol;
  const found = CURRENCIES.find((x) => x.code.toUpperCase() === c.toUpperCase());
  return found ? found.symbol : c;
}

/**
 * Валюта для конкретного запису:
 * 1) своя (currency_custom, напр. «грн» або «₴»),
 * 2) обрана зі списку (currency),
 * 3) загальна для сайту (default_currency з налаштувань),
 * 4) євро.
 */
export function resolveCurrency(item?: { currency?: string | null; currency_custom?: string | null }, siteDefault?: string | null): string {
  const custom = String(item?.currency_custom || "").trim();
  if (custom) return custom;
  const code = String(item?.currency || "").trim();
  if (code) return currencySymbol(code);
  const def = String(siteDefault || "").trim();
  if (def) return currencySymbol(def);
  return currencySymbol(DEFAULT_CURRENCY);
}
