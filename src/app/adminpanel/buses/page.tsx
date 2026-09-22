"use client";

import { ResourceManager, type FieldDef } from "@/components/admin/ui";

const fields: FieldDef[] = [
  { key: "photos", label: "Фотографії", type: "photos", span: true }, 
  { key: "name", label: "Назва", type: "text", placeholder: "Mercedes-Benz Sprinter" },
  { key: "slug", label: "Slug (унікальний)", type: "text", placeholder: "mercedes-sprinter", hint: "Латиниця, без пробілів" },
  { key: "brand", label: "Марка", type: "text", placeholder: "Mercedes-Benz" },
  { key: "model", label: "Модель", type: "text", placeholder: "Sprinter 519" },
  { key: "seats", label: "Кількість місць", type: "number", placeholder: "19" },
  { key: "year", label: "Рік випуску", type: "number", placeholder: "2021" },
  { key: "bus_type", label: "Тип транспорту", type: "text", placeholder: "Мікроавтобус" },
  { key: "price", label: "Ціна", type: "text", placeholder: "80" },
  {
    key: "price_unit", label: "Одиниця розрахунку", type: "select",
    options: [
      { value: "година", label: "€ / година" },
      { value: "день", label: "€ / день" },
      { value: "поїздка", label: "€ / поїздка" },
      { value: "км", label: "€ / км" },
    ],
  },
  { key: "description", label: "Короткий опис", type: "textarea", span: true, placeholder: "Комфортабельний мікроавтобус для туристичних і корпоративних поїздок." },
  { key: "specs", label: "Характеристики", type: "list", placeholder: "Кондиціонер", span: true },
  { key: "rental_terms", label: "Умови оренди", type: "textarea", span: true, placeholder: "Мінімальне замовлення — 3 години." },
  { key: "sort_order", label: "Порядок відображення", type: "number" },
  { key: "active", label: "Показувати на сайті", type: "bool" },
];

export default function BusesAdmin() {
  return (
    <ResourceManager
      type="buses"
      title="Автобуси та мікроавтобуси"
      description="Додавайте транспорт, керуйте фото (головне + порядок), цінами, умовами та видимістю. Можна не видаляти, а приховувати."
      addLabel="Додати транспорт"
      fields={fields}
      primaryKey="name"
      secondaryKey="bus_type"
      thumbKey="main_photo"
      searchKeys={["name", "brand", "model", "bus_type"]}
      defaults={{
        slug: "", name: "", brand: "", model: "", seats: 0, year: new Date().getFullYear(),
        bus_type: "", description: "", specs: [], rental_terms: "", price: "", price_unit: "година",
        photos: [], photo_captions: [], main_photo: "", sort_order: 0, active: true,
      }}
    />
  );
}
