export type CartItem = {
  id: number;
  variant_id: number;
  product: string;
  product_slug: string;
  variant: string;
  sku: string;
  quantity: number;
  price_irr: number;
  line_total_irr: number;
  available: boolean;
};

export type Cart = {
  id: number;
  items: CartItem[];
  subtotal_irr: number;
};
