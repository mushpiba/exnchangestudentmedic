// Finds known products and ingredients in OCR text or a typed query.
import { FAMILIES, INGREDIENTS, PRODUCTS } from "../content/medicines";
import { FOREIGN, type ForeignProduct } from "../content/foreignMeds";

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

export type ForeignFound = {
  /** Home-country products whose name was typed (or starts with what was typed). */
  products: ForeignProduct[];
  /** Ingredients NARU can explain, typed by name. */
  ingredients: string[];
  /** Ingredient names NARU only knows from foreign products (INN). */
  inns: string[];
};

/** What a student typed about a medicine from home: product names first, ingredient names otherwise. */
export function findForeign(raw: string): ForeignFound {
  const text = squash(raw);
  if (text.length < 2) return { products: [], ingredients: [], inns: [] };
  const names = (p: ForeignProduct) => [p.name, ...p.match].map(squash);
  // Chinese brand names are often two characters (泰诺, 快克); other scripts need three to mean anything.
  const long = (n: string) => n.length >= (/\p{Script=Han}/u.test(n) ? 2 : 3);
  // Whole names found in the text; "panadol extra" also contains "panadol", so keep the longest.
  const whole = FOREIGN.map((p) => ({ p, hit: names(p).filter((n) => long(n) && locate(text, n) >= 0).sort((a, b) => b.length - a.length)[0] }))
    .filter((x): x is { p: ForeignProduct; hit: string } => !!x.hit);
  const longest = whole.filter((x) => !whole.some((y) => y !== x && y.hit.length > x.hit.length && y.hit.includes(x.hit))).map((x) => x.p);
  // Plus names that start with the text: a bare brand ("panadol") lists every product of that brand to pick from.
  const started = long(text) ? FOREIGN.filter((p) => names(p).some((n) => n.startsWith(text))) : [];
  let products = [...new Set([...longest, ...started])];
  // Last resort: the brand word alone ("цитрамон таблетки"), offered as a list to pick from.
  if (!products.length) {
    const brand = (n: string) => squash(n.split(/[\s(-]/)[0]);
    products = FOREIGN.filter((p) => [p.name, ...p.match].map(brand).some((b) => b.length >= 4 && text.includes(b)));
  }

  const ingredients = analyze(raw).ingredients.map((i) => i.id);
  const inns = [...new Set(FOREIGN.flatMap((p) => p.ingredients.filter((i) => !i.id).map((i) => i.inn)))].filter(
    (inn) => locate(text, squash(inn)) >= 0,
  );
  return { products, ingredients, inns };
}

export type Alternative = { id: string; kind: "single" | "combo" | "none"; products: string[] };

/**
 * Korean products for a set of ingredients. `same`: exactly that set (only for 2+ ingredients, and only when
 * `complete`: a medicine with an ingredient NARU can't explain has no "same" product).
 * `each`: per ingredient, products with only that ingredient. For a one-ingredient medicine, failing that, combinations
 * that contain it. For a combination, other combinations are left out: taking one beside single-ingredient products
 * could double an ingredient. "none" only when no Korean product NARU knows contains the ingredient at all.
 */
export function koreanAlternatives(ids: string[], complete = true): { same: string[]; each: Alternative[] } {
  // Adult products only; count ingredients as MFDS lists them (the dictionary leaves some out, e.g. methionine).
  const all = Object.entries(PRODUCTS).filter(([, p]) => !p.kids);
  const count = (p: (typeof PRODUCTS)[string]) => p.mainKo.split("/").length;
  const has = (p: (typeof PRODUCTS)[string], id: string) => p.ingredients.some((i) => i.id === id);
  const same = complete && ids.length > 1 ? all.filter(([, p]) => count(p) === ids.length && ids.every((id) => has(p, id))).map(([k]) => k) : [];
  const each = ids.flatMap((id): Alternative[] => {
    const single = all.filter(([, p]) => count(p) === 1 && has(p, id)).map(([k]) => k);
    if (single.length) return [{ id, kind: "single", products: single }];
    const combos = all.filter(([, p]) => count(p) > 1 && has(p, id)).map(([k]) => k);
    if (!combos.length) return [{ id, kind: "none", products: [] }];
    return ids.length === 1 ? [{ id, kind: "combo", products: combos }] : [];
  });
  return { same, each };
}
