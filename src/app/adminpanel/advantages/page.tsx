"use client";

import { ResourceManager, type FieldDef } from "@/components/admin/ui";

const fields: FieldDef[] = [
  { key: "title", label: "Заголовок", type: "text", placeholder: "Комфортабельний транспорт" },
  { key: "icon", label: "Іконка", type: "icon", span: true },
  { key: "text", label: "Опис", type: "textarea", span: true },
  { key: "sort_order", label: "Порядок", type: "number" },
  { key: "active", label: "Показувати", type: "bool" },
];

export default function AdvantagesAdmin() {
  return (
    <ResourceManager
      type="advantages"
      title="Переваги"
      description="Блок «Чому обирають нас». Кількість переваг не обмежена - додавайте, редагуйте, змінюйте порядок."
      addLabel="Додати перевагу"
      fields={fields}
      primaryKey="title"
      secondaryKey="text"
      searchKeys={["title"]}
      defaults={{ title: "", text: "", icon: "check", sort_order: 0, active: true }}
    />
  );
}
