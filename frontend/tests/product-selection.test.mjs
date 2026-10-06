import assert from "node:assert/strict";
import test from "node:test";
import { initialVariant, matchingOptionVariant, parseQuantity } from "../lib/product-selection.ts";

const variant = (id, available, isDefault, color, size = "small") => ({
  id, available, is_default: isDefault,
  option_values: [
    { definition: { id: 1 }, value: { slug: color } },
    { definition: { id: 2 }, value: { slug: size } },
  ],
});

test("initial selection uses an available default, or available alternative", () => {
  const unavailableDefault = variant(1, false, true, "blue");
  const available = variant(2, true, false, "yellow");
  assert.equal(initialVariant([unavailableDefault, available]), available);
  const availableDefault = variant(3, true, true, "red");
  assert.equal(initialVariant([available, availableDefault]), availableDefault);
});

test("sold-out products keep a model for displaying price, and empty products have none", () => {
  const soldOut = variant(1, false, true, "blue");
  assert.equal(initialVariant([soldOut]), soldOut);
  assert.equal(initialVariant([]), null);
});

test("option changes preserve other selections and resolve an available SKU", () => {
  const blueSmall = variant(1, true, true, "blue");
  const redLarge = variant(2, true, false, "red", "large");
  const redSmall = variant(3, true, false, "red");
  assert.equal(matchingOptionVariant([blueSmall, redLarge, redSmall], blueSmall, 1, "red"), redSmall);
});

test("unavailable and impossible combinations cannot be selected", () => {
  const current = variant(1, true, true, "blue");
  const soldOut = variant(2, false, false, "yellow");
  const differentSize = variant(3, true, false, "red", "large");
  assert.equal(matchingOptionVariant([current, soldOut, differentSize], current, 1, "yellow"), null);
  assert.equal(matchingOptionVariant([current, soldOut, differentSize], current, 1, "red"), null);
});

test("quantity respects the cart API integer limits", () => {
  for (const value of ["", " ", "0", "-1", "1.5", "1000", "no", "Infinity"]) assert.equal(parseQuantity(value), null);
  assert.equal(parseQuantity("1"), 1);
  assert.equal(parseQuantity("999"), 999);
  assert.equal(parseQuantity("12"), 12);
});
