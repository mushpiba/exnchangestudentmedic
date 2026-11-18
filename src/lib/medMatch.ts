// Finds known products and ingredients in OCR text or a typed query.
import { FAMILIES, INGREDIENTS, PRODUCTS } from "../content/medicines";

/** Lowercase, compatibility-fold (㎎ → mg) and drop spaces/punctuation. OCR splits Korean words with spaces. */
export function squash(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}.%]/gu, "");
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return row[b.length];
}

/** Index of name in text; tolerates one OCR error in names of 5+ characters, two in 9+. */
export function locate(text: string, name: string): number {
  const exact = text.indexOf(name);
  if (exact >= 0 || name.length < 5) return exact;
  const allowed = name.length >= 9 ? 2 : 1;
  for (let i = 0; i + name.length - 1 <= text.length; i++) {
    for (const len of [name.length, name.length - 1, name.length + 1]) {
      const window = text.slice(i, i + len);
      if (window.length === len && distance(window, name) <= allowed) return i;
    }
  }
  return -1;
}

const AMOUNT = /^[^\d]{0,6}?(\d+(?:\.\d+)?)(mg|mcg|ml|g|%|밀리그램|밀리그람|그램|밀리리터)/;
const UNIT: Record<string, string> = { 밀리그램: "mg", 밀리그람: "mg", 그램: "g", 밀리리터: "mL", ml: "mL" };

export type Found = {
  products: string[];
  /** Brands seen without a specific product name: ingredients differ between their products. */
  families: string[];
  ingredients: { id: string; amount?: string }[];
  rx: boolean;
  otc: boolean;
  bag: boolean;
};

export function analyze(raw: string): Found {
  const text = squash(raw);
  const products = Object.entries(PRODUCTS)
    .filter(([, p]) => [p.ko, ...p.match].some((n) => locate(text, squash(n)) >= 0))
    .map(([id]) => id);
  const matchedFamilies = new Set(products.map((id) => PRODUCTS[id].family));
  const families = Object.entries(FAMILIES)
    .filter(([family, names]) => !matchedFamilies.has(family) && names.some((n) => text.includes(squash(n))))
    .map(([family]) => family);

  const ingredients = new Map<string, string | undefined>();
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    for (const name of ing.names.map(squash)) {
      const at = locate(text, name);
      if (at < 0) continue;
      const amount = text.slice(at + name.length, at + name.length + 22).match(AMOUNT);
      ingredients.set(id, amount ? amount[1] + " " + (UNIT[amount[2]] ?? amount[2]) : ingredients.get(id));
      break;
    }
  }
  // Some names contain another ingredient's name; keep only the more specific match.
  if (ingredients.has("levocetirizine")) ingredients.delete("cetirizine");
  if (ingredients.has("dexibuprofen")) ingredients.delete("ibuprofen");
  // "클로르페니라민말레산염" contains "페니라민말레산".
  if (ingredients.has("chlorpheniramine") && !/(^|[^르])페니라민|(^|[^r])pheniramine/.test(text)) ingredients.delete("pheniramine");

  for (const id of products)
    for (const ing of PRODUCTS[id].ingredients)
      if (!ingredients.has(ing.id)) ingredients.set(ing.id, ing.amount);

  return {
    products,
    families,
    ingredients: [...ingredients].map(([id, amount]) => ({ id, amount })),
    rx: text.includes("전문의약품"),
    otc: text.includes("일반의약품"),
    bag: /복약안내|조제일|조제약사|약제비|복용방법/.test(text),
  };
}

/** Ingredients shared between two lists, for duplicate-dose warnings. */
export const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x));
