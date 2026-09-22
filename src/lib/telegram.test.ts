import { describe, expect, it } from "vitest";
import { escapeHtml, formatLead } from "./telegram";

describe("escapeHtml", () => {
  it("escapes characters that break Telegram HTML", () => {
    expect(escapeHtml("<b>Ігор & Co</b>")).toBe("&lt;b&gt;Ігор &amp; Co&lt;/b&gt;");
  });
  it("handles empty and non-string input", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("42");
  });
});

describe("formatLead", () => {
  const lead = {
    name: "Ігор <script>",
    phone: "+380671112233",
    bus: "Mercedes-Benz Sprinter (19 місць)",
    route: "Київ - Львів",
    passengers: "18",
    message: "Потрібен трансфер",
  };

  it("includes every provided field", () => {
    const text = formatLead(lead);
    expect(text).toContain("Нова заявка з сайту");
    expect(text).toContain("Ігор &lt;script&gt;");
    expect(text).toContain("+380671112233");
    expect(text).toContain("Mercedes-Benz Sprinter");
    expect(text).toContain("Київ - Львів");
    expect(text).toContain("18");
    expect(text).toContain("Потрібен трансфер");
  });

  it("omits empty optional fields", () => {
    const text = formatLead({ name: "Тест", phone: "+380000000000" });
    expect(text).not.toContain("Транспорт:");
    expect(text).not.toContain("Маршрут:");
    expect(text).not.toContain("Коментар:");
    expect(text).toContain("Тест");
  });

  it("escapes user input so Telegram HTML stays valid", () => {
    const text = formatLead({ name: "<i>x</i>", phone: "1", message: "a & b" });
    expect(text).toContain("&lt;i&gt;x&lt;/i&gt;");
    expect(text).toContain("a &amp; b");
    expect(text).not.toContain("<i>x</i>");
  });
});
