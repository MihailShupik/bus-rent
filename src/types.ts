export type Bus = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  model: string;
  seats: number;
  year: number | null;
  bus_type: string;
  description: string;
  specs: string[];
  rental_terms: string;
  price: string;
  price_unit: string;
  photos: string[];
  main_photo: string;
  sort_order: number;
  active: boolean;
};

export type Service = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  sort_order: number;
  active: boolean;
};

export type Advantage = {
  id: number;
  title: string;
  text: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type Step = {
  id: number;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type Application = {
  id: number;
  name: string;
  phone: string;
  email: string;
  bus: string;
  route: string;
  passengers: string;
  message: string;
  status: string;
  created_at: string;
};

export type ContentFieldType = "text" | "textarea" | "number" | "image" | "list" | "bool";

export type ContentField = {
  key: string;
  label: string;
  type: ContentFieldType;
};

export type ContentType = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  fields: ContentField[];
  sort_order: number;
  active: boolean;
};

export type ContentItem = {
  id: number;
  type_slug: string;
  data: Record<string, any>;
  sort_order: number;
  active: boolean;
};
