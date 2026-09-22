"use client";

import { ResourceManager, type FieldDef } from "@/components/admin/ui";

const fields: FieldDef[] = [
  { key: "title", label: "Заголовок кроку", type: "text", placeholder: "Залиште заявку" },
  { key: "icon", label: "Іконка", type: "icon", span: true },
  { key: "description", label: "Опис", type: "textarea", span: true },
  { key: "sort_order", label: "Порядок", type: "number" },
  { key: "active", label: "Показувати", type: "bool" },
];

export default function StepsAdmin() {
  return (
    <ResourceManager
      type="steps"
      title="Кроки замовлення"
      description="Блок «Як відбувається замовлення». Нумерація формується автоматично за порядком."
      addLabel="Додати крок"
      fields={fields}
      primaryKey="title"
      secondaryKey="description"
      searchKeys={["title"]}
      defaults={{ title: "", description: "", icon: "check", sort_order: 0, active: true }}
    />
  );
}
