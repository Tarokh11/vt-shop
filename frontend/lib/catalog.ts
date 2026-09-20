export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: string | null;
  position: number;
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  description: string;
  position: number;
};

export type AttributeValue = {
  id: number;
  label: string;
  slug: string;
  position: number;
};

export type AttributeDefinition = {
  id: number;
  name: string;
  slug: string;
  is_visible?: boolean;
  is_filterable?: boolean;
  position: number;
  values: AttributeValue[];
};

export type Collection = {
  id: number;
  name: string;
  slug: string;
  description: string;
  position: number;
};

export type ProductOptionValue = {
  definition: Pick<AttributeDefinition, "id" | "name" | "slug">;
  value: AttributeValue;
};

export type ProductImage = {
  id: number;
  image: string;
  alt_text: string;
  position: number;
};

export type ProductVariant = {
  id: number;
  sku: string;
  name: string;
  options: Record<string, string>;
  option_values: ProductOptionValue[];
  price_irr: number;
  available: boolean;
  is_default: boolean;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  brand: Brand | null;
  categories: Category[];
  attributes: ProductOptionValue[];
  option_definitions: { id: number; definition: Pick<AttributeDefinition, "id" | "name" | "slug">; position: number }[];
  collections: Collection[];
  images: ProductImage[];
  variants: ProductVariant[];
};

export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CatalogFilters = {
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
  attributes: AttributeDefinition[];
};

export function formatIrr(amount: number): string {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ریال`;
}
