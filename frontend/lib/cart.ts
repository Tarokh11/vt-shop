export type CartItem = {
  id: number;
  variant_id: number;
  product: string;
  product_slug: string;
  product_image: string | null;
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

export type Favorite = {
  id: number;
  created_at: string;
  product: { id: number; name: string; slug: string; image: string | null };
};
