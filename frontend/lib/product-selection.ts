import type { ProductVariant } from "./catalog";

export function initialVariant(variants: ProductVariant[]): ProductVariant | null {
  return variants.find((variant) => variant.available && variant.is_default)
    ?? variants.find((variant) => variant.available)
    ?? variants.find((variant) => variant.is_default)
    ?? variants[0]
    ?? null;
}

export function optionValue(variant: ProductVariant, optionId: number): string | undefined {
  return variant.option_values.find((option) => option.definition.id === optionId)?.value.slug;
}

export function matchingOptionVariant(variants: ProductVariant[], current: ProductVariant, optionId: number, value: string): ProductVariant | null {
  const selected = new Map(current.option_values.map((option) => [option.definition.id, option.value.slug]));
  selected.set(optionId, value);
  return variants.find((variant) => variant.available && [...selected].every(([id, slug]) => optionValue(variant, id) === slug)) ?? null;
}

export function parseQuantity(value: string): number | null {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 999 ? quantity : null;
}
