export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
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
  price_irr: number;
  available: boolean;
  is_default: boolean;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  categories: Category[];
  images: ProductImage[];
  variants: ProductVariant[];
};

export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function formatIrr(amount: number): string {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ریال`;
}
