export const companyName = "BusRent";

export const contacts = {
  phoneDisplay: "+380 44 123 45 67",
  phoneRaw: "+380441234567",
  phoneDisplay2: "+380 67 123 45 67",
  phoneRaw2: "+380671234567",
  viberRaw: "+380441234567",
  whatsappRaw: "380441234567",
  email: "info@bus-rent.ua",
  address: "м. Київ, вул. Транспортна, 12",
  workingHours: "Працюємо 24/7",
  area: "Київ та Україна, міжнародні рейси",
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
