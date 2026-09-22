"use client";

import { ResourceManager, type FieldDef } from "@/components/admin/ui";

const fields: FieldDef[] = [
  { key: "name", label: "Назва послуги", type: "text", placeholder: "Оренда автобуса" },
  { key: "slug", label: "Slug (унікальний)", type: "text", placeholder: "bus-rental" },
  { key: "icon", label: "Іконка", type: "icon", span: true },
  { key: "description", label: "Опис", type: "textarea", span: true, placeholder: "Автобус з водієм для групових поїздок." },
  { key: "image", label: "Фото (необов'язково)", type: "image", span: true },
  { key: "sort_order", label: "Порядок", type: "number" },
  { key: "active", label: "Показувати", type: "bool" },
];

export default function ServicesAdmin() {
  return (
    <ResourceManager
      type="services"
      title="Послуги"
      description="Блок «Наші послуги». Додавайте необмежену кількість послуг з іконкою та описом."
      addLabel="Додати послугу"
      fields={fields}
      primaryKey="name"
      secondaryKey="description"
      thumbKey="image"
      searchKeys={["name"]}
      defaults={{ slug: "", name: "", description: "", icon: "bus", image: "", sort_order: 0, active: true }}
    />
  );
}
