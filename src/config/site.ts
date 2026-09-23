export const companyName = "BusRent";

// Резервні значення, якщо налаштування взагалі відсутнє в базі.
// Навмисно ПОРОЖНІ: жодних вигаданих телефонів/адрес — порожнє поле
// в адмінці має лишатися порожнім на сайті, а не підмінятися заглушкою.
export const contacts = {
  phoneDisplay: "",
  phoneRaw: "",
  phoneDisplay2: "",
  phoneRaw2: "",
  viberRaw: "",
  whatsappRaw: "",
  email: "",
  address: "",
  workingHours: "Працюємо 24/7",
  area: "",
} as const;

export const socialLinks = {
  phone: `tel:${contacts.phoneRaw}`,
  phone2: `tel:${contacts.phoneRaw2}`,
  viber: `viber://chat?number=${encodeURIComponent(contacts.viberRaw)}`,
  whatsapp: `https://wa.me/${contacts.whatsappRaw}`,
  email: `mailto:${contacts.email}`,
} as const;

export const navItems = [
  { href: "#hero", label: "Головна" },
  { href: "#about", label: "Про компанію" },
  { href: "#buses", label: "Автобуси" },
  { href: "#services", label: "Послуги" },
  { href: "#contacts", label: "Контакти" },
] as const;
