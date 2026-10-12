import { formatIrr, type Product } from "./catalog";

// Keep pricing, availability and short specs identical across listing layouts.
export function productPresentation(product: Product) {
  const availableVariants = product.variants.filter((variant) => variant.available);
  const prices = (availableVariants.length ? availableVariants : product.variants).map((variant) => variant.price_irr);
  const specifications = [
    ...product.attributes.map((attribute) => `${attribute.definition.name}: ${attribute.value.label}`),
    ...product.option_definitions.map(({ definition }) => {
      const values = [...new Set(product.variants.flatMap((variant) => variant.option_values.filter((option) => option.definition.id === definition.id).map((option) => option.value.label)))];
      return values.length ? `${definition.name}: ${values.join("، ")}` : "";
    }).filter(Boolean),
  ].slice(0, 2);
  return {
    available: availableVariants.length > 0,
    image: product.images[0],
    specifications,
    priceLabel: prices.length ? `${Math.min(...prices) !== Math.max(...prices) ? "از " : ""}${formatIrr(Math.min(...prices))}` : "بدون قیمت",
  };
}
